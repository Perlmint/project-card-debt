const PIXI = require('pixi.js');

const PhoneWidth = 300;
const PhoneMargin = 10;

export default class Phone extends PIXI.Container {
  constructor() {
    super();

    /** @member */
    this.frame = new PIXI.Graphics();
    this.addChild(this.frame);
    window.addEventListener('resize', (e) => {
      this.drawFrame(window.innerHeight);
    });
    this.drawFrame(window.innerHeight);

    this.remain_time = new PIXI.Text("05:00 ", {
      fontSize: 60
    });
    this.remain_time.position.set(PhoneWidth / 2 + PhoneMargin, PhoneMargin + 300 + 100);
    this.remain_time.anchor.set(0.5, 0.5);
    this.addChild(this.remain_time);
  }

  /**
   *
   * @param {number} height
   */
  drawFrame(height) {
    this.frame.beginFill(0x333333, 1);
    this.frame.drawRoundedRect(PhoneMargin, 300 + PhoneMargin, PhoneWidth - PhoneMargin * 2, height - 300 - PhoneMargin * 2, 10);
    this.frame.beginFill(0xFFFFFF, 1);
    this.frame.drawRect(PhoneMargin * 2, 300 + PhoneMargin * 2, PhoneWidth - PhoneMargin * 4, height - 300 - PhoneMargin * 4);
  }
}
