const PIXI = require('pixi.js');
const clamp = require('lodash/clamp');

export default class Map extends PIXI.Container {
    constructor(data) {
        super();
        this.data = data;
        this.dragging = false;
        this.drag_pos = null;

        this.interactive = true;
        this.buttonMode = true;
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

            node.interactive = true;
            node.buttonMode = true;
            node.on('pointertap', () => {
                this.onNodeClick(idx);
            });

            return node;
        });
    }

    onNodeClick(node_idx) {
        console.log(node_idx);
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
            this.x = clamp(new_x, 0, this.data.width);
            this.y = clamp(new_y, 0, this.data.height);
        }
    }
}
