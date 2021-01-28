const PIXI = require('pixi.js');
const sample = require('lodash/sample');
const random = require('lodash/random');
const { SharedTweenManager, PUXI } = require('./tween');
const head = PIXI.Texture.from(require('./res/head.png'));
const body = [PIXI.Texture.from(require('./res/body1.png'))];
const hair = [PIXI.Texture.from(require('./res/hair1.png'))];
const leg = PIXI.Texture.from(require('./res/leg.png'));

function randomColor() {
  return random(0, 255, false) * 0x10000 + random(0, 255, false) * 0x100 + random(0, 255, false);
}

export default class Player extends PIXI.projection.Container2d {
  constructor(map, start_node_idx) {
    super();

    this.wrap = new PIXI.Container();
    this.addChild(this.wrap);

    SharedTweenManager.tween(
      new PIXI.Point(0, 0),
      new PIXI.Point(0, 20),
      500,
      PUXI.PointErp,
      PUXI.EaseBoth
    ).target(this.wrap, "position").repeat(Number.POSITIVE_INFINITY, true);

    /** @member */
    this.leg = PIXI.Sprite.from(leg);
    this.leg.position.set(16.06, 222.69);
    // left: 16.06px;
    // top: 484px;
    this.wrap.addChild(this.leg);
    this.body = PIXI.Sprite.from(sample(body));
    this.body.position.set(7.56, 155.69);
    this.body.tint = randomColor();
    // left: 7.56;
    // top: 417px;
    this.wrap.addChild(this.body);
    this.head = PIXI.Sprite.from(head);
    this.head.position.set(16.06, 35.69);
    // left: 16.06px;
    // top: 297px
    this.wrap.addChild(this.head);
    this.hair = PIXI.Sprite.from(sample(hair));
    this.hair.tint = randomColor();
    // left: 0;
    // top: 261.31px;
    this.wrap.addChild(this.hair);
    this.pivot.set(89.64, 351.69);
    this.scale.set(0.2);

    this.proj.affine = PIXI.projection.AFFINE.AXIS_X;
    this.rotation = Math.PI / 4;

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
    if (this.x > target_node.x || this.y > target_node.y) {
      this.scale.x = Math.abs(this.scale.x);
    } else {
      this.scale.x = -Math.abs(this.scale.x);
    }
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
