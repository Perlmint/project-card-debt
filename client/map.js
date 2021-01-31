const PIXI = require('pixi.js');
const clamp = require('lodash/clamp');
const Player = require('./player').default;
const MoveDialog = require('./move_dialog').default;
const { default: FoundActionDialog, ActionProgressDialog } = require('./found_action_dialog');
const LostActionDialog = require('./lost_action_dialog').default;
const pick = require('lodash/pick');
const values = require('lodash/values');
const eventemitter = require('eventemitter3');
const { textures: building_textures, ui_data: building_ui_data, data: building_data } = require('./building');

const action_data = require('./action.json');
const constant = require('./const.json');

const TileSize = 100;
const YScale = 0.58;
const MapMargin = TileSize * 2;

/** @class */
export default class Map extends eventemitter {
  /**
   *
   * @param {*} data
   * @param {number} initial_pos
   */
  constructor(data, { montage, pos: initial_pos, role, todo }) {
    super();
    this.data = data;
    this.ui_root = new PIXI.Container();
    this.ui_root.dragging = false;
    this.ui_root.drag_pos = null;

    this.ui_root.interactive = true;
    this.ui_root
      .on('pointerdown', (e) => this.onDragStart(e))
      .on('pointerup', (e) => this.onDragEnd(e))
      .on('pointerupoutside', (e) => this.onDragEnd(e))
      .on('pointermove', (e) => this.onDragMove(e));;

    this.initIsometryTile(data.width, data.height);
    this.ui_root.hitArea = new PIXI.Rectangle(0, 0, this.virtual_size.x * 2, this.virtual_size.y * 2);

    // this.edges = data.edges.map(([node1, node2, time]) => {
    //   const edge = new PIXI.Graphics();
    //   edge.lineStyle(6, 0x000000, 1);
    //   const begin_node = data.nodes[node1];
    //   const end_node = data.nodes[node2];
    //   const width = end_node.x - begin_node.x;
    //   const height = end_node.y - begin_node.y;
    //   edge.moveTo(0, 0);
    //   edge.lineTo(width * TileSize, height * TileSize);
    //   edge.position.set((begin_node.x + 0.5) * TileSize, (begin_node.y + 0.5) * TileSize);
    //   this.root.addChild(edge);
    // });

    // const building_layer = new PIXI.display.Layer();
    // building_layer.sortableChildren = true;
    // this.wrap.addChild(building_layer);

    /** @member {PIXI.Graphics[]} */
    this.nodes = data.nodes.map((node_info, idx) => {
      const data = building_ui_data[node_info.building_id];
      const node = new PIXI.projection.Sprite2d(building_textures[data.name]);
      node.proj.affine = PIXI.projection.AFFINE.AXIS_X;
      node.rotation = Math.PI / 4;
      node.anchor.set(0.5, 1);
      node.position.set(node_info.position[0] * TileSize, (node_info.position[1] + 1) * TileSize);
      // node.parentLayer = building_layer;
      // node.zOrder = this.data.width - node_info.position[0] + node_info.position[1];
      this.root.addChild(node);
      // node.lineStyle(5, 0x000000, 1);
      // node.beginFill(0xffffff, 1);
      // node.drawRect(-TileSize * 0.5, -TileSize * 0.5, TileSize, TileSize);
      // node.position.set((node_info.x + 0.5) * TileSize, (node_info.y + 0.5) * TileSize);
      // this.root.addChild(node);

      node.on('pointertap', () => {
        this.onNodeClick(idx);
      });

      return node;
    });

    // this.connection = new window.Map();
    // for (const [node1, node2, distance] of data.edges) {
    //   this.addConnection(node1, node2, distance);
    //   this.addConnection(node2, node1, distance);
    // }

    /** @member */
    this.move_dialog = new MoveDialog();
    this.move_dialog.on('go', (idx) => {
      this.player.moveTo(idx);
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
      this.action_dialog.on('do', (id) => this.onDoAction(id));
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

  /**
   *
   * @param {number} width
   * @param {number} height
   */
  initIsometryTile(width, height) {
    this.wrap = new PIXI.Container();
    this.wrap.sortableChildren = true;
    this.wrap.scale.y = YScale;
    this.ui_root.addChild(this.wrap);

    this.base_y = width * Math.sin(Math.PI / 4) * TileSize * this.wrap.scale.y + MapMargin;
    this.virtual_size = new PIXI.Point(
      (width * Math.cos(Math.PI / 4) + height * Math.cos(Math.PI / 4)) * TileSize + MapMargin * 2,
      ((width * Math.sin(Math.PI / 4) + height * Math.sin(Math.PI / 4)) * TileSize + MapMargin * 2) * YScale,
    );
    this.wrap.y = this.base_y;
    console.log(this.virtual_size);

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

  addConnection(node1, node2, distance) {
    let connection = this.connection.get(node1);
    if (!connection) {
      connection = new window.Map();
      this.connection.set(node1, connection);
    }

    connection.set(node2, distance);
  }

  calcDistance(node1, node2) {
    node1 = this.data.nodes[node1];
    node2 = this.data.nodes[node2];
    return Math.sqrt(Math.pow(node1.position[0] - node2.position[0], 2) + Math.pow(node1.position[1] - node2.position[1], 2)) * constant.MAP_DIST_SCALE;
  }

  onNodeClick(node_idx) {
    const node = this.data.nodes[node_idx];
    const building = building_data[node.building_id];
    const actions = values(pick(action_data, building.actions));

    this.move_dialog.init(building.name, actions, node_idx, this.calcDistance(this.player.current_node, node_idx));
    const node_pos = this.data.nodes[node_idx].position;
    this.move_dialog.position = this.calcCellInternalPosition(node_pos[0], node_pos[1]);
    // this.move_dialog.root.position.set(node_pos.x, node_pos.y);
    this.wrap.addChild(this.move_dialog);
  }

  onDoAction(action_id) {
    const action = action_data[action_id];

    for (const node of this.nodes) {
      node.buttonMode = node.interactive = false;
    }
    this.wrap.removeChild(this.action_dialog);

    const node_pos = this.data.nodes[this.player.current_node].position;
    this.action_progress.init(action);
    this.action_progress.position = this.calcCellInternalPosition(node_pos[0], node_pos[1]);
    this.wrap.addChild(this.action_progress);
    setTimeout(() => {
      this.emit('target_noti', action.targets, this.player.current_node, action.montage_part_init, action.montage_part_decay * 1000, action.delay_post * 1000);
    }, action.deplay_pre * 1000);
  }

  onDragStart(event) {
    this.drag_pos = event.data.getLocalPosition(this.ui_root.parent);
    this.dragging = true;
  }

  onDragEnd() {
    this.dragging = false;
    this.drag_pos = null;
  }

  onDragMove(event) {
    if (this.dragging) {
      const newPosition = event.data.getLocalPosition(this.ui_root.parent);
      let new_x = newPosition.x - this.drag_pos.x + this.wrap.x;
      let new_y = newPosition.y - this.drag_pos.y + this.wrap.y;
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

  calcCellInternalPosition(x, y) {
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

  calcCellGlobalPosition(x, y) {
    const ret = this.calcCellInternalPosition(x, y);
    ret.x += this.wrap.x;
    ret.y += this.wrap.y;

    return ret;
  }

  onPlayerArrival(node_idx) {
    // for (const [connected_idx,] of this.connection.get(node_idx)) {
    //   const node = this.nodes[connected_idx];
    //   node.interactive = true;
    //   node.buttonMode = true;
    // }
    for (const node of this.nodes) {
      node.buttonMode = node.interactive = true;
    }

    const node = this.data.nodes[node_idx];
    const building = building_data[node.building_id];
    const actions = values(pick(action_data, building.actions));

    this.action_dialog.init(building.name, actions);
    const node_pos = this.data.nodes[node_idx].position;
    this.action_dialog.position = this.calcCellInternalPosition(node_pos[0], node_pos[1]);
    this.wrap.addChild(this.action_dialog);
    this.emit('player_arrival', node_idx);
  }

  onPlayerDepature(node_idx) {
    // for (const [connected_idx,] of this.connection.get(node_idx)) {
    //   const node = this.nodes[connected_idx];
    //   node.interactive = false;
    //   node.buttonMode = false;
    // }
    for (const node of this.nodes) {
      node.buttonMode = node.interactive = false;
    }

    this.root.removeChild(this.move_dialog, this.action);
    this.emit('player_depature');
  }
}
