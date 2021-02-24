import * as PIXI from 'pixi.js';
import { sprintf } from 'sprintf-js';
import background from 'game-asset!./res/timer.png';
import constants from '../data/const.json';

export default class CountDownTimer extends PIXI.Container {
  frame: PIXI.Sprite;
  remain_time: PIXI.Text;
  remain: number;

  constructor() {
    super();
    
    const marginX = 27;
    const marginY = 28;
    this.pivot.set(200 - marginX, 0 - marginY);

    this.frame = PIXI.Sprite.from(background);
    this.frame.anchor.set(0, 0);
    this.frame.position.set(0, 0);
    this.addChild(this.frame);

    this.remain_time = new PIXI.Text('00:00', {
      fontSize: 40,
      align: 'center',
      fill: '0x414243',
    });
    this.remain_time.position.set(65, 70);
    this.remain_time.anchor.set(0.5, 0.4);
    this.addChild(this.remain_time);

    this.remain = 0;
  }

  start() {
    // milli seconds
    this.remain = 20 * 60 * 60 * 1000;
    PIXI.Ticker.shared.add(this.onTick, this);
  }

  onTick() {
    this.remain -= PIXI.Ticker.shared.deltaMS * constants.TIME_MULTIPLIER;
    if (this.remain <= 0) {
      this.remain = 0;
      PIXI.Ticker.shared.remove(this.onTick, this);
      this.emit('end');
    }
    this.remain_time.text = sprintf(
      '%02d:%02d',
      this.remain / 60 / 1000 / constants.TIME_MULTIPLIER,
      this.remain / 1000 / constants.TIME_MULTIPLIER % 60
    );
  }

  stop() {
    PIXI.Ticker.shared.remove(this.onTick, this);
  }
}
