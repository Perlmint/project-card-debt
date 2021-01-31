const PIXI = require('pixi.js');
const action_background = PIXI.Texture.from(require('./res/alarm.png'));
const background = PIXI.Texture.from(require('./res/move_background.png'));
const mission_box = PIXI.Texture.from(require('./res/mission_box.png'));
const TimeBar = require('./time_bar').default;

class ActionItem extends PIXI.NineSlicePlane {
  constructor() {
    super(action_background, 32, 32, 32, 32);

    this.width = 266 + 12 * 2;
    this.height = 87 + 7 + 17;

    this.title = new PIXI.Text('', {
      fontSize: 16,
      fontWeight: 500
    });
    this.title.alpha = 0.87;
    this.title.position.set(20 + 12, 20 + 7);
    this.addChild(this.title);

    this.detail = new PIXI.Text('', {
      fontSize: 14,
      fontWeight: 400
    });
    this.detail.alpha = 0.5413;
    this.detail.position.set(20 + 12, 53 + 7);
    this.addChild(this.detail);

    this.mission = new PIXI.Sprite(mission_box);
    this.mission.position.set(206 + 12, 20 + 7);
  }

  init(action, targets) {
    this.title.text = action.action_name;
    if (action.delay_pre != 0) {
      this.detail.text = `조용함,  ${action.delay_pre}분`;
    } else {
      this.detail.text = `시끄러움,  ${action.delay_post}분`;
    }

    this.removeChild(this.mission);
    for (const target of targets) {
      if (action.targets.indexOf(target) !== -1) {
        this.addChild(this.mission);
      }
    }
  }
}

export class ActionProgressDialog extends PIXI.Container {
  constructor(targets) {
    super();

    this.item = new ActionItem();
    this.addChild(this.item);

    const time_bar_bg = new PIXI.NineSlicePlane(action_background, 17, 11, 17, 23);
    time_bar_bg.width = 266 + 12 * 2;
    time_bar_bg.height = 23 + 17 + 7;
    time_bar_bg.position.set(0, 103 - 7);
    this.addChild(time_bar_bg);

    this.time_bar = new TimeBar();
    this.time_bar.position.set(12, 103);
    this.time_bar.resize(266, 23, null, null, 0xCFDDF2, 4);
    this.time_bar.on('complete', () => {
      this.emit('complete');
    })
    this.addChild(this.time_bar);

    this.targets = targets;

    this.pivot.set(-40, this.height);
  }

  init(action) {
    this.item.init(action, this.targets);
    this.time_bar.countdown((action.delay_pre + action.delay_post) * 60 * 1000);
  }
}

export default class ActionDialog extends PIXI.NineSlicePlane {
  constructor(targets) {
    super(background, 32, 32, 32, 32);

    this.targets = targets;
    this.width = 330 + 12 * 2;

    /** @member */
    this.name_label = new PIXI.Text("", {
      fontWeight: 700,
      fontSize: 20,
    });
    this.name_label.position.set(165 + 12, 27 + 7);
    this.name_label.anchor.x = 0.5;
    this.addChild(this.name_label);

    /** @member {ActionItem[]}*/
    this.action_buttons = [];
  }

  /**
   *
   * @param {string} name
   * @param {any[]} actions
   */
  init(name, actions) {
    let height = 0;
    this.name_label.text = name;
    this.name_label.updateText();
    height += this.name_label.height + 20 + this.name_label.y;
    for (const label of this.action_buttons) {
      this.removeChild(label);
    }
    let width = this.name_label.width;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      let action_item;
      if (this.action_buttons[i]) {
        action_item = this.action_buttons[i];
      } else {
        action_item = new ActionItem();
        action_item.x = 32;
        action_item.buttonMode = action_item.interactive = true;
        this.action_buttons.push(action_item);
      }
      action_item.on('pointertap', () => {
        this.emit('do', action.action_id);
      });
      action_item.init(action, this.targets);
      action_item.y = height;
      this.addChild(action_item);

      height += action_item.height;
      width = Math.max(action_item.width, width);
    }

    this.height = height + 37;
    this.pivot.set(-40, height + 90);
  }
}
