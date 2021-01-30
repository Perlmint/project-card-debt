const PIXI = require('pixi.js');
const constants = require('./const.json');
const sprintf = require('sprintf-js').sprintf;
const EventEmitter = require('eventemitter3');

export default class CountDownTimer extends EventEmitter {
  constructor() {
    super();

    this.root = new PIXI.Container();

    this.root.pivot.set(200, 0);

    /** @member */
    this.frame = new PIXI.Graphics();
    this.frame.beginFill(0x0000ff, 1);
    this.frame.drawRect(0, 0, 200, 100);
    this.root.addChild(this.frame);

    this.remain_time = new PIXI.Text('00:00', {
      fontSize: 50
    });
    this.remain_time.position.set(100, 50);
    this.remain_time.anchor.set(0.5, 0.5);
    this.root.addChild(this.remain_time);
  }

  start() {
    // micro seconds
    this.remain = 20 * 60 * 1000;
    PIXI.Ticker.shared.add(this.onTick, this);
  }

  onTick(delta) {
    this.remain -= delta * constants.TIME_MULTIPLIER;
    if (this.remain <= 0) {
      this.remain = 0;
      PIXI.Ticker.shared.remove(this.onTick, this);
      this.emit('end');
    }
    this.remain_time.text = sprintf(
      '%02d:%02d',
      this.remain / 60 / 1000,
      this.remain / 1000 % 60
    );
  }
}
