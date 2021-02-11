import * as PIXI from 'pixi.js';
import { ActionType } from "../data/action";

const background = PIXI.Texture.from(require('./res/move_background.png'));
const action_background = PIXI.Texture.from(require('./res/alarm.png'));

class ActionItem extends PIXI.NineSlicePlane {
  title: PIXI.Text;
  constructor() {
    super(action_background, 32, 32, 32, 32);

    this.width = 266 + 12 * 2;
    this.height = 87;

    this.title = new PIXI.Text('', {
      fontSize: 16,
      fontWeight: 500,
    });
    this.title.alpha = 0.87;
    this.title.position.set(20 + 12, 20 + 7);
    this.addChild(this.title);
  }

  init(action: Pick<ActionType, 'action_name'>) {
    this.title.text = action.action_name;
  }
}

export default class ActionDialog extends PIXI.NineSlicePlane {
  name_label: PIXI.Text;
  action_buttons: ActionItem[];
  constructor() {
    super(background, 32, 32, 32, 32);

    this.width = 330 + 12 * 2;

    this.name_label = new PIXI.Text("", {
      fontWeight: 700,
      fontSize: 20,
    });
    this.name_label.position.set(165 + 12, 27 + 7);
    this.name_label.anchor.x = 0.5;
    this.addChild(this.name_label);

    this.action_buttons = [];
  }

  init(name: string) {
    const actions = [{
      action_name: '몽타주 수집',
    }];
    let height = 0;
    this.name_label.text = name;
    this.name_label.updateText(true);
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
        action_item.title.text = action.action_name;
      } else {
        action_item = new ActionItem();
        action_item.x = 32;
        action_item.interactive = true;
        action_item.buttonMode = true;
        this.action_buttons.push(action_item);
      }
      action_item.on('pointertap', () => {
        this.emit('do');
      });
      action_item.init(action);
      action_item.y = height;
      this.addChild(action_item);
      height += action_item.height;
      width = Math.max(action_item.width, width);
    }

    this.height = height + 37;
    this.pivot.set(-40, height + 90);
  }
}
