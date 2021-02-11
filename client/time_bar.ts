import * as PIXI from 'pixi.js';
import ProgressBar from './progress_bar';
import constants from '../data/const.json';
import { sprintf } from 'sprintf-js';

export default class TimeBar extends ProgressBar {
  remain_time: PIXI.Text;
  remain: number = 0;
  countdown_duration: number = 0;
  constructor() {
    super();

    /** @member */
    this.remain_time = new PIXI.Text('00:00', {
      fontSize: 14,
    });
    this.remain_time.anchor.set(0.5, 0.5);
    this.addChild(this.remain_time);
  }

  resize(width: number, height: number, bg_color?: number, bg_line?: number, color?: number, radius = 0) {
    super.resize(width, height, bg_color, bg_line, color, radius);

    this.remain_time.position.set(width / 2, height / 2);
  }

  /**
   * @param {Number} duration game time
   */
  countdown(duration: number) {
    this.remain = duration;
    this.countdown_duration = duration;

    PIXI.Ticker.shared.add(this.onTick, this);
  }

  onTick() {
    this.remain -= PIXI.Ticker.shared.deltaMS * constants.TIME_MULTIPLIER;
    if (this.remain <= 0) {
      this.remain = 0;
      this.emit('complete');
      PIXI.Ticker.shared.remove(this.onTick, this);
    }

    this.remain_time.text = sprintf(
      '%02d:%02d',
      this.remain / 60 / 60 / 1000,
      this.remain / 60 / 1000 % 60
    );
    this.setProgress(this.remain / this.countdown_duration);
  }
}
