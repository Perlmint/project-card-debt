import { sortBy, clamp, pick, values } from 'lodash';

import * as PIXI from 'pixi.js';
import Player from './player';
import MoveDialog from './move_dialog';
import FoundActionDialog, { ActionProgressDialog } from './found_action_dialog';
import LostActionDialog from'./lost_action_dialog';
import { TEXTURES as building_textures, ui_data as building_ui_data, data as building_data, BuildingId } from './building';
import TILES from 'game-asset-glob!./res/map_obj/*.png';
import map_obj_id from './res/map_obj/id.json';
const tiles = (() => {
  return map_obj_id.map(d => {
    return {
      texture: TILES[d.name],
      ...d
    };
  });
})();

import action_data, { ActionId, ActionType } from '../data/action';
import constant from '../data/const.json';
import { Montage } from './montage';
import { TodoType } from '../data/todo';

const TileSize = 100;
const YScale = 0.58;
const MapMargin = TileSize * 2;

interface MapData {
  width: number,
  height: number,
  nodes: {
    building_id: BuildingId,
    position: [number, number]
  }[],
  tiles: number[][],
}

export default class Map extends PIXI.Container {
  dragging: boolean;
  drag_pos: null | PIXI.Point;
  virtual_size!: PIXI.Point;
  nodes: PIXI.DisplayObject[];
  root!: PIXI.Container;
  move_dialog: MoveDialog;
  player: Player;
  action_dialog: FoundActionDialog | LostActionDialog;
  targets?: number[];
  wrap!: PIXI.Container;
  action_progress!: ActionProgressDialog;
  base_y!: number;
  constructor(private data: MapData, { montage, pos: initial_pos, role, todo }: { montage: Montage, pos: number, role: 'lost' | 'found', todo: TodoType}) {
    super();
    
    this.dragging = false;
    this.drag_pos = null;

    this.interactive = true;
    this
      .on('pointerdown', (e: PIXI.InteractionEvent) => this.onDragStart(e))
      .on('pointerup', () => this.onDragEnd())
      .on('pointerupoutside', () => this.onDragEnd())
      .on('pointermove', (e: PIXI.InteractionEvent) => this.onDragMove(e));

    this.initIsometryTile(data.width, data.height);
    this.hitArea = new PIXI.Rectangle(0, 0, this.virtual_size.x * 2, this.virtual_size.y * 2);

    this.nodes = data.nodes.map((node_info, idx) => {
      const data = building_ui_data[node_info.building_id];
      const node = new PIXI.projection.Sprite2d(PIXI.Texture.from(building_textures[`${data.name}`]));
      node.proj.affine = PIXI.projection.AFFINE.AXIS_X;
      node.rotation = Math.PI / 4;

      node.anchor.set(data.h / (data.w + data.h) ,1);

      node.position.set(node_info.position[0] * TileSize, (node_info.position[1] + 1) * TileSize);

      node.on('pointertap', () => {
        this.onNodeClick(idx);
      });

      return node;
    });

    let objects = [...this.nodes];
    for (let x = 0; x < data.width; x++) {
      for (let y = 0; y < data.height; y++) {
        const tile_code = data.tiles[y][x];
        if (tile_code === 0) {
          continue;
        }

        const tile_data = tiles[tile_code - 1];
        const tile = new PIXI.projection.Sprite2d(PIXI.Texture.from(tile_data.texture));
        tile.proj.affine = PIXI.projection.AFFINE.AXIS_X;
        tile.rotation = Math.PI / 4;
        tile.anchor.set(tile_data.h / (tile_data.w + tile_data.h), 1);
        tile.position.set(x * TileSize, (y + 1) * TileSize);
        objects.push(tile);
      }
    }

    objects = sortBy(objects, o => -o.x, o => o.y);
    this.root.addChild(...objects);

    /** @member */
    this.move_dialog = new MoveDialog();
    this.move_dialog.on('go', (idx: number, by_car: boolean) => {
      this.player.moveTo(idx, by_car);
      if (by_car && role === 'found') {
        this.emit('car', data.nodes[idx].building_id);
      }
    });
    this.move_dialog.scale.y = 1 / YScale;
    if (role === 'lost') {
      this.action_dialog = new LostActionDialog();
      this.action_dialog.on('do', () => {
        this.emit('montage', this.player.current_node);
        this.wrap.removeChild(this.action_dialog);
      });
    } else {
      this.targets = todo.targets;
      this.action_dialog = new FoundActionDialog(todo.targets);
      this.action_dialog.on('do', (id: number) => this.onDoAction(id));
      this.action_progress = new ActionProgressDialog(todo.targets);
      this.action_progress.on('complete', () => {
        for (const node of this.nodes) {
          node.buttonMode = node.interactive = true;
        }
        this.wrap.removeChild(this.action_progress);
      });
      this.action_progress.scale.y = 1 / YScale;
    }
    this.action_dialog.scale.y = 1 / YScale;

    /** @member */
    this.player = new Player(this, initial_pos, montage);
    this.root.addChild(this.player);
  }

  initIsometryTile(width: number, height: number) {
    this.wrap = new PIXI.Container();
    this.wrap.sortableChildren = true;
    this.wrap.scale.y = YScale;
    this.addChild(this.wrap);

    this.base_y = width * Math.sin(Math.PI / 4) * TileSize * this.wrap.scale.y + MapMargin;
    this.virtual_size = new PIXI.Point(
      (width * Math.cos(Math.PI / 4) + height * Math.cos(Math.PI / 4)) * TileSize + MapMargin * 2,
      ((width * Math.sin(Math.PI / 4) + height * Math.sin(Math.PI / 4)) * TileSize + MapMargin * 2) * YScale,
    );
    this.wrap.y = this.base_y;

    const isometryPlane = new PIXI.Graphics();
    isometryPlane.rotation = -Math.PI / 4;
    this.root = isometryPlane;
    this.wrap.addChild(isometryPlane);

    isometryPlane.lineStyle(2, 0xffffff);
    for (let i = 0; i <= height; i++) {
      isometryPlane.moveTo(0, i * TileSize);
      isometryPlane.lineTo(width * TileSize, i * TileSize);
    }
    for (let i = 0; i <= width; i++) {
      isometryPlane.moveTo(i * TileSize, 0);
      isometryPlane.lineTo(i * TileSize, height * TileSize);
    }
  }

  calcDistance(node1_idx: number, node2_idx: number) {
    const node1 = this.data.nodes[node1_idx];
    const node2 = this.data.nodes[node2_idx];
    return Math.sqrt(
      Math.pow(node1.position[0] - node2.position[0], 2) +
      Math.pow(node1.position[1] - node2.position[1], 2)
    ) * constant.MAP_DIST_SCALE;
  }

  onNodeClick(node_idx: number) {
    if (this.player.current_node == node_idx) {
      this.showActionDialog(node_idx);
    } else {
      this.wrap.removeChild(this.action_dialog);

      const node = this.data.nodes[node_idx];
      const building = building_data[node.building_id as unknown as BuildingId];
      const actions = values(pick(action_data, building.actions)) as ActionType[];

      this.move_dialog.init(building.name, actions, node_idx, this.calcDistance(this.player.current_node, node_idx));
      const node_pos = this.data.nodes[node_idx].position;
      this.move_dialog.position.copyFrom(this.calcCellInternalPosition(node_pos[0], node_pos[1]));
      this.wrap.addChild(this.move_dialog);
    }
  }

  onDoAction(action_id: number) {
    const action = action_data[action_id as unknown as ActionId];

    for (const node of this.nodes) {
      node.buttonMode = node.interactive = false;
    }
    this.wrap.removeChild(this.action_dialog);

    const node_pos = this.data.nodes[this.player.current_node].position;
    this.action_progress.init(action);
    this.action_progress.position.copyFrom(this.calcCellInternalPosition(node_pos[0], node_pos[1]));
    this.wrap.addChild(this.action_progress);
    setTimeout(() => {
      this.emit('target_noti', action.targets, this.player.current_node, action.montage_part_init, action.montage_part_decay * 1000 * 60, action.delay_post * 1000 * 60);
    }, action.delay_pre * 1000 * 60 / constant.TIME_MULTIPLIER);
  }

  onDragStart(event: PIXI.InteractionEvent) {
    this.drag_pos = event.data.getLocalPosition(this.parent);
    this.dragging = true;
  }

  onDragEnd() {
    this.dragging = false;
    this.drag_pos = null;
  }

  onDragMove(event: PIXI.InteractionEvent) {
    if (this.dragging) {
      const newPosition = event.data.getLocalPosition(this.parent);
      let new_x = newPosition.x - this.drag_pos!.x + this.wrap.x;
      let new_y = newPosition.y - this.drag_pos!.y + this.wrap.y;
      new_x = clamp(new_x, -(this.virtual_size.x - window.innerWidth), 0);
      new_y = clamp(new_y, -(this.virtual_size.y - window.innerHeight) + this.base_y, this.base_y);
      this.drag_pos = newPosition;
      this.emit('scroll', {
        x: new_x - this.wrap.x,
        y: new_y - this.wrap.y,
      });
      this.wrap.position.set(new_x, new_y,);
    }
  }

  calcCellInternalPosition(x: number, y: number) {
    return new PIXI.Point(
       x * TileSize * Math.cos(Math.PI / 4) +
      (y + 1) * TileSize * Math.cos(Math.PI / 4),

      (
        (this.data.width - x + 1) * TileSize * Math.sin(Math.PI / 4) +
        (y + 2) * TileSize * Math.sin(Math.PI / 4)
        -this.base_y / YScale + MapMargin
      ),
    );
  }

  calcCellGlobalPosition(x: number, y: number) {
    const ret = this.calcCellInternalPosition(x, y);
    ret.x += this.wrap.x;
    ret.y += this.wrap.y;

    return ret;
  }

  showActionDialog(node_idx: number) {
    const node = this.data.nodes[node_idx];
    const building = building_data[node.building_id as unknown as BuildingId];
    const actions = values(pick(action_data, building.actions)) as ActionType[];

    this.action_dialog.init(building.name, actions);
    const node_pos = this.data.nodes[node_idx].position;
    this.action_dialog.position.copyFrom(this.calcCellInternalPosition(node_pos[0], node_pos[1]));
    this.wrap.addChild(this.action_dialog);
    this.wrap.removeChild(this.move_dialog);
  }

  onPlayerArrival(node_idx: number) {
    for (const node of this.nodes) {
      node.buttonMode = node.interactive = true;
    }

    this.showActionDialog(node_idx);
    this.emit('player_arrival', node_idx);
  }

  onPlayerDepature() {
    for (const node of this.nodes) {
      node.buttonMode = node.interactive = false;
    }

    this.root.removeChild(this.move_dialog, this.action_dialog);
    this.emit('player_depature');
  }
}
