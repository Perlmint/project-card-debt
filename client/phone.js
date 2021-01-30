const PUXI = require('@puxi/core');
const background = PIXI.Texture.from(require('./res/phone.png'));
const news_background = PIXI.Texture.from(require('./res/alarm.png'));
const ScrollContainer = require('./scroll_container').default;
const last = require('lodash/last');

class Alarm extends PIXI.Sprite {
  constructor(title) {
    super(news_background);

    this.tint = 0xffffff;
    this.title = new PIXI.Text(title, {
      fontWeight: '500',
      fontSize: 20,
    });
    this.title.position.set(27, 32);
    this.addChild(this.title);
  }
}

export default class Phone extends PIXI.Sprite {
  constructor() {
    super(background);

    this.interactive = true;
    this.alarms = [];
    this.montage = {
      hair_color: null,
      hair_type: null,
      body_color: null,
      body_type: null,
      leg_color: null,
      leg_type: null,
    };

    this.innerView = new ScrollContainer(52, 308, 440, 702, 218);
    this.addChild(this.innerView.po);
  }

  addNews(title_text) {
    const alarm = new Alarm(title_text);
    this.innerView.addItem(alarm);
    console.log(title_text);
  }

  addMontage(montage) {
    Object.assign(this.montage, montage);
    console.log(montage);
  }
}
