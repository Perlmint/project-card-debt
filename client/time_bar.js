const ProgressBar = require('./progress_bar').default;
const { SharedTweenManager, PUXI } = require('./tween');
const constants = require('./const.json');
const sprintf = require('sprintf-js').sprintf;

export default class TimeBar extends ProgressBar {
  constructor() {
    super();

    /** @member */
    this.remain_time = new PIXI.Text('00:00', {
      fontSize: 14,
    });
    this.remain_time.anchor.set(0.5, 0.5);
    this.addChild(this.remain_time);
  }

  resize(width, height, bg_color, bg_line, color, radius = 0) {
    super.resize(width, height, bg_color, bg_line, color, radius);

    this.remain_time.position.set(width / 2, height / 2);
  }

  /**
   *
   * @param {Number} duration microsecs
   */
  countdown(duration) {
    this.remain = duration;

    SharedTweenManager.tween(
      duration,
      0,
      duration / constants.TIME_MULTIPLIER,
      PUXI.NumberErp,
      PUXI.EaseLinear
    ).target(this, "remain").on('update', () => {
      this.remain_time.text = sprintf(
        '%02d:%02d',
        this.remain / 60 / 1000,
        this.remain / 1000 % 60
      );
      this.setProgress(this.remain / duration);
    }).on('complete', () => {
      this.emit('complete');
    });
  }
}
