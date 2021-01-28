const PIXI = require('pixi.js');
const { SharedTweenManager, PUXI } = require('./tween');

export default class Player extends PIXI.Sprite {
  constructor(map, start_node_idx) {
    const text_render = new PIXI.Text('옷');
    text_render.cacheAsBitmap = true;
    text_render.updateText(false);

    super(text_render.texture);
    this.anchor.set(0.5, 1);

    /** @member {Map} */
    this.map = map;

    this.current_node = start_node_idx;
    const start_node = map.nodes[start_node_idx];

    this.position.set(start_node.x, start_node.y);
    map.onPlayerArrival(start_node_idx);
  }

  moveTo(new_idx) {
    const distance = this.map.connection.get(this.current_node).get(new_idx);
    const target_node = this.map.nodes[new_idx];
    this.map.onPlayerDepature(this.current_node);
    SharedTweenManager.tween(
      new PIXI.Point(this.x, this.y),
      new PIXI.Point(target_node.x, target_node.y),
      distance * 100,
      PUXI.PointErp,
      PUXI.EaseLinear
    ).target(this, "position").on('complete', () => {
      this.current_node = new_idx;
      this.map.onPlayerArrival(new_idx);
    });
  }
}
