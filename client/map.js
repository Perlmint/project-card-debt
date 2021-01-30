const PIXI = require('pixi.js');
const clamp = require('lodash/clamp');
const random = require('lodash/random');
const Player = require('./player').default;
const Dialog = require('./dialog').default;
const eventemitter = require('eventemitter3');

const TileSize = 100;

/** @class */
export default class Map extends eventemitter {
  /**
   *
   * @param {*} data
   * @param {number} initial_pos
   */
  constructor(data, initial_pos) {
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

    this.edges = data.edges.map(([node1, node2, time]) => {
      const edge = new PIXI.Graphics();
      edge.lineStyle(6, 0x000000, 1);
      const begin_node = data.nodes[node1];
      const end_node = data.nodes[node2];
      const width = end_node.x - begin_node.x;
      const height = end_node.y - begin_node.y;
      edge.moveTo(0, 0);
      edge.lineTo(width * TileSize, height * TileSize);
      edge.position.set((begin_node.x + 0.5) * TileSize, (begin_node.y + 0.5) * TileSize);
      this.root.addChild(edge);
    });

    this.buildings = data.buildings.map((build_info) => {
      const building = new PIXI.Graphics();
      building.beginFill(build_info.color, 1);
      building.moveTo(-TileSize * 0.5, -TileSize * 0.5);
      building.lineTo(-TileSize * 0.5, TileSize * 0.5);
      building.lineTo(TileSize * 0.5, TileSize * 0.5);
      building.position.set((build_info.x + 0.5) * TileSize, (build_info.y + 0.5) * TileSize);

      this.root.addChild(building);
    });

    /** @member {PIXI.Graphics[]} */
    this.nodes = data.nodes.map((node_info, idx) => {
      const node = new PIXI.Graphics();
      node.lineStyle(5, 0x000000, 1);
      node.beginFill(0xffffff, 1);
      node.drawRect(-TileSize * 0.5, -TileSize * 0.5, TileSize, TileSize);
      node.position.set((node_info.x + 0.5) * TileSize, (node_info.y + 0.5) * TileSize);
      this.root.addChild(node);

      node.on('pointertap', () => {
        this.onNodeClick(idx);
      });

      return node;
    });

    this.connection = new window.Map();
    for (const [node1, node2, distance] of data.edges) {
      this.addConnection(node1, node2, distance);
      this.addConnection(node2, node1, distance);
    }

    /** @member */
    this.dialog = new Dialog();

    /** @member */
    this.player = new Player(this, initial_pos);
    this.root.addChild(this.player);
  }

  /**
   *
   * @param {number} width
   * @param {number} height
   */
  initIsometryTile(width, height) {
    this.wrap = new PIXI.Container();
    this.wrap.scale.y = 0.58; // isometry can be achieved by setting scaleY 0.5 or tan(30 degrees)
    this.ui_root.addChild(this.wrap);

    this.virtual_size = new PIXI.Point(width * TileSize * Math.cos(Math.PI / 4), height * TileSize * Math.sin(Math.PI / 4) * 0.58);
    this.wrap.position.set(0, this.virtual_size.y);

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

  onNodeClick(node_idx) {
    this.player.moveTo(node_idx);
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
      const new_x = newPosition.x - this.drag_pos.x + this.wrap.x;
      const new_y = newPosition.y - this.drag_pos.y + this.wrap.y;
      this.drag_pos = newPosition;
      this.wrap.position.set(
        clamp(new_x, -this.virtual_size.x * 0.5, 0),
        clamp(new_y, -this.virtual_size.y * 0.5, 0) + this.virtual_size.y
      );
    }
  }

  onPlayerArrival(node_idx) {
    for (const [connected_idx,] of this.connection.get(node_idx)) {
      const node = this.nodes[connected_idx];
      node.interactive = true;
      node.buttonMode = true;
    }

    const node = this.data.nodes[node_idx];
    const actions = node.actions;
    if (actions) {
      this.dialog.init(node.name, actions);
      const node_pos = this.nodes[node_idx].position;
      this.dialog.position.set(node_pos.x, node_pos.y);
      this.root.addChild(this.dialog);
    }
    this.emit('player_arrival', node_idx);
  }

  onPlayerDepature(node_idx) {
    for (const [connected_idx,] of this.connection.get(node_idx)) {
      const node = this.nodes[connected_idx];
      node.interactive = false;
      node.buttonMode = false;
    }

    this.root.removeChild(this.dialog);
    this.emit('player_depature');
  }
}
