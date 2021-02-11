import * as PIXI from 'pixi.js';
import mapValues from 'lodash/mapValues';
import { Tween } from '@tweenjs/tween.js';

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
import constants from '../data/const.json';
import { Montage } from './montage';
import Map from './map';

export function createHead(montage: Pick<Montage, 'hair_color' | 'hair_type'>) {
  const wrap = new PIXI.Container();
  const head_ = PIXI.Sprite.from(head);
  head_.position.set(23.76, 45.02);
  wrap.addChild(head_);
  const hair_ = PIXI.Sprite.from(hair[montage.hair_type]);
  hair_.tint = montage.hair_color;
  wrap.addChild(hair_);

  return wrap;
}

export function createHeadTexture(montage: Pick<Montage, 'hair_color' | 'hair_type'>, scale: number) {
  const head = createHead(montage);
  head.scale.set(scale, scale);
  const texture = PIXI.RenderTexture.create({ width: head.width, height: head.height });
  window.app.renderer.render(head, texture);

  return texture;
}

export default class Player extends PIXI.projection.Container2d {
  wrap: PIXI.Container;
  leg: PIXI.Sprite;
  body: PIXI.Sprite;
  current_node: number;
  bounce_tween: Tween<PIXI.Point>;

  constructor(private map: Map, start_node_idx: number, montage: Montage) {
    super();

    this.wrap = new PIXI.Container();
    this.addChild(this.wrap);

    this.bounce_tween = new Tween(this.wrap.position)
      .to({ x: 0, y: 20 }, 500)
      .yoyo(true)
      .repeat(Infinity)
      .start();

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
    
    this.current_node = start_node_idx;
    const start_node = map.nodes[start_node_idx];

    this.position.set(start_node.x, start_node.y);
    map.onPlayerArrival(start_node_idx);
  }

  moveTo(new_idx: number, by_car: boolean) {
    const target_node = this.map.nodes[new_idx];
    const distance = this.map.calcDistance(this.current_node, new_idx);
    this.map.onPlayerDepature();
    if (this.x > target_node.x || this.y > target_node.y) {
      this.scale.x = Math.abs(this.scale.x);
    } else {
      this.scale.x = -Math.abs(this.scale.x);
    }

    new Tween(this.position)
    .to(
      { x: target_node.x, y: target_node.y }, 
      distance / (by_car ? constants.CAR_SPEED : constants.WALK_SPEED) * 1000 * 60 / constants.TIME_MULTIPLIER,
    ).onComplete(() => {
      this.current_node = new_idx;
      this.map.onPlayerArrival(new_idx);
    }).start();
  }
}
