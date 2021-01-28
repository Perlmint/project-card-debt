const PIXI = require('pixi.js');
const clamp = require('lodash/clamp');
const random = require('lodash/random');
const Player = require('./player').default;

/** @class */
export default class Map extends PIXI.Container {
    constructor(data) {
        super();
        this.data = data;
        this.dragging = false;
        this.drag_pos = null;

        this.interactive = true;
        this.hitArea = new PIXI.Rectangle(0, 0, data.width, data.height);
        this
            .on('pointerdown', (e) => this.onDragStart(e))
            .on('pointerup', (e) => this.onDragEnd(e))
            .on('pointerupoutside', (e) => this.onDragEnd(e))
            .on('pointermove', (e) => this.onDragMove(e));;

        this.edges = data.edges.map(([node1, node2, time]) => {
            const edge = new PIXI.Graphics();
            edge.lineStyle(6, 0x000000, 1);
            const begin_node = data.nodes[node1];
            const end_node = data.nodes[node2];
            const width = end_node.x - begin_node.x;
            const height = end_node.y - begin_node.y;
            edge.moveTo(0, 0);
            edge.lineTo(width, height);
            edge.position.set(begin_node.x, begin_node.y);
            this.addChild(edge);
        });

        /** @member {PIXI.Graphics[]} */
        this.nodes = data.nodes.map((node_info, idx) => {
            const node = new PIXI.Graphics();
            node.lineStyle(5, 0x000000, 1);
            node.beginFill(0xffffff, 1);
            node.drawCircle(-10, -10, 20);
            node.position.set(node_info.x, node_info.y);
            this.addChild(node);
            if (node_info.name) {
                const label = new PIXI.Text(node_info.name);
                node.addChild(label);
                label.cacheAsBitmap = true;
                label.anchor.set(0.5, 1);
                label.position.y = -30;
            }

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

        this.player = new Player(this, random(0, this.nodes.length, false));
        this.addChild(this.player);
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
        this.drag_pos = event.data.getLocalPosition(this.parent);
        this.dragging = true;
    }

    onDragEnd() {
        this.dragging = false;
        this.drag_pos = null;
    }

    onDragMove(event) {
        if (this.dragging) {
            const newPosition = event.data.getLocalPosition(this.parent);
            const new_x = newPosition.x - this.drag_pos.x + this.x;
            const new_y = newPosition.y - this.drag_pos.y + this.y;
            this.drag_pos = newPosition;
            this.x = clamp(new_x, -this.data.width, 0);
            this.y = clamp(new_y, -this.data.height, 0);
        }
    }

    onPlayerArrival(node_idx) {
      for (const [connected_idx,] of this.connection.get(node_idx)) {
        const node = this.nodes[connected_idx];
        node.interactive = true;
        node.buttonMode = true;
      }
    }

    onPlayerDepature(node_idx) {
      for (const [connected_idx,] of this.connection.get(node_idx)) {
        const node = this.nodes[connected_idx];
        node.interactive = false;
        node.buttonMode = false;
      }
    }
}
