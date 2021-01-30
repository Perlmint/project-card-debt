const PIXI = require('pixi.js');

export default class ProgressBar extends PIXI.Container {
  constructor() {
    super();

    /** @member */
    this.background = new PIXI.Graphics();
    this.addChild(this.background);

    /** @member */
    this.bar = new PIXI.Graphics();
    this.addChild(this.bar);

    /** @member */
    this.bar_mask = new PIXI.Graphics();
    this.bar.mask = this.bar_mask;
  }

  resize(width, height, bg_color, bg_line, color, radius = 0) {
    this.background.clear();
    if (bg_color != null) {
      this.background.beginFill(bg_color, 1);
    }
    if (bg_line != null) {
      this.background.lineStyle(1, bg_line);
    }
    this.background.drawRoundedRect(0, 0, width, height, radius); // todo: change it!

    this.bar_mask.clear();
    this.bar_mask.beginFill(0xFFFFFF, 1);
    this.bar_mask.drawRoundedRect(this.x, this.y, width, height, radius); // todo: change it!

    this.bar.clear();
    this.bar.beginFill(color, 1);
    this.bar.drawRoundedRect(0, 0, width, height, radius);
  }

  /**
   *
   * @param {Number} progress 0~1
   */
  setProgress(progress) {
    this.bar.x = -this.bar.width * (1 - progress);
  }
}
