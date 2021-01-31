const PIXI = require('pixi.js');
const background = PIXI.Texture.from(require('./res/timer.png'));
const constants = require('./const.json');
const sprintf = require('sprintf-js').sprintf;
const EventEmitter = require('eventemitter3');

export default class CountDownTimer extends EventEmitter {
  constructor() {
    super();

    this.root = new PIXI.Container();
    const marginX = 27;
    const marginY = 28;
    this.root.pivot.set(200 - marginX, 0 - marginY);

    /** @member */
    this.frame = new PIXI.Sprite(background);
    this.frame.anchor.set(0, 0);
    this.frame.position.set(0, 0);
    this.root.addChild(this.frame);

    this.remain_time = new PIXI.Text('00:00', {
      fontSize: 40,
      align: 'center',
      fill: '0x414243', 
    });
    this.remain_time.position.set(65, 70);
    this.remain_time.anchor.set(0.5, 0.4);
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
