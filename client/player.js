const PIXI = require('pixi.js');
const random = require('lodash/random');
const mapValues = require('lodash/mapValues');
const { SharedTweenManager, PUXI } = require('./tween');
const head = PIXI.Texture.from(require('./res/player/head.png'));
export const body = mapValues(
  require('./res/player/body*.png'),
  (v) => PIXI.Texture.from(v)
);
export const hair = mapValues(
  require('./res/player/hair*.png'),
  (v) => PIXI.Texture.from(v)
);
export const leg = mapValues(
  require('./res/player/leg*.png'),
  (v) => PIXI.Texture.from(v)
);
const constants = require('./const.json');

export function createHead(montage) {
  const wrap = new PIXI.Container();
  const head_ = PIXI.Sprite.from(head);
  head_.position.set(23.76, 45.02);
  wrap.addChild(head_);
  const hair_ = PIXI.Sprite.from(hair[montage.hair_type]);
  hair_.tint = montage.hair_color;
  wrap.addChild(hair_);

  return wrap;
}

export function createHeadTexture(montage, scale) {
  const head = createHead(montage);
  head.scale.set(scale, scale);
  const texture = PIXI.RenderTexture.create({ width: head.width, height: head.height });
  app.renderer.render(head, texture);

  return texture;
}

export default class Player extends PIXI.projection.Container2d {
  constructor(map, start_node_idx, montage) {
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
    this.leg = PIXI.Sprite.from(leg[montage.leg_type]);
    this.leg.tint = montage.leg_color;
    this.leg.position.set(97 - 64, 209.23 + 72.79);
    // left: 16.06px;
    // top: 484px;
    this.wrap.addChild(this.leg);
    this.body = PIXI.Sprite.from(body[montage.body_type]);
    this.body.position.set(8, 153);
    this.body.tint = montage.body_color;
    // left: 7.56;
    // top: 417px;
    this.wrap.addChild(this.body);
    const head = createHead(montage);
    this.wrap.addChild(head);
    this.pivot.set(97, 351.69 - 80);
    this.scale.set(0.2);

    this.proj.affine = PIXI.projection.AFFINE.AXIS_X;
    this.rotation = Math.PI / 4;

    /** @member {Map} */
    this.map = map;

    console.log(start_node_idx);
    this.current_node = start_node_idx;
    const start_node = map.nodes[start_node_idx];

    this.position.set(start_node.x, start_node.y);
    map.onPlayerArrival(start_node_idx);
  }

  moveTo(new_idx, by_car) {
    // const distance = this.map.connection.get(this.current_node).get(new_idx);
    const target_node = this.map.nodes[new_idx];
    const distance = Math.sqrt(Math.pow(target_node.position.x - this.position.x, 2) + Math.pow(target_node.position.y - this.position.y, 2));
    this.map.onPlayerDepature(this.current_node);
    if (this.x > target_node.x || this.y > target_node.y) {
      this.scale.x = Math.abs(this.scale.x);
    } else {
      this.scale.x = -Math.abs(this.scale.x);
    }
    SharedTweenManager.tween(
      new PIXI.Point(this.x, this.y),
      new PIXI.Point(target_node.x, target_node.y),
      distance * 1000 / constants.TIME_MULTIPLIER / (by_car ? constants.CAR_SPEED : constants.WALK_SPEED),
      PUXI.PointErp,
      PUXI.EaseLinear
    ).target(this, "position").on('complete', () => {
      this.current_node = new_idx;
      this.map.onPlayerArrival(new_idx);
    });
  }
}
