import * as PIXI from 'pixi.js';
import { ActionType } from '../data/action';
import background from 'game-asset!./res/move_background.png';
import by_car_button from 'game-asset!./res/by_car_button.png';
import by_walk_button from 'game-asset!./res/by_walk_button.png';
import constant from '../data/const.json';

export default class MoveDialog extends PIXI.NineSlicePlane {
  name_label: PIXI.Text;
  action_labels: PIXI.Text[];
  by_car_button: PIXI.Sprite;
  node_idx?: number;
  by_car_label: PIXI.Text;
  by_walk_button: PIXI.Sprite;
  by_walk_label: PIXI.Text;
  constructor() {
    super(PIXI.Texture.from(background), 32, 32, 32, 32);
    this.name_label = new PIXI.Text("", {
      fontWeight: 700,
      fontSize: 20,
    });
    this.name_label.position.set(32, 27);
    this.addChild(this.name_label);

    this.action_labels = [];

    this.by_car_button = PIXI.Sprite.from(by_car_button);
    this.by_car_button.interactive = true;
    this.by_car_button.buttonMode = true;
    this.by_car_button.x = 32;
    this.by_car_button.on('pointertap', () => {
      this.emit('go', this.node_idx, true);
      this.parent.removeChild(this);
    });
    this.addChild(this.by_car_button);

    this.by_car_label = new PIXI.Text('', {
      fontSize: 14,
      fontWeight: 400
    });
    this.by_car_label.alpha = 0.5413;
    this.by_car_label.position.set(49, 13);
    this.by_car_button.addChild(this.by_car_label);

    this.by_walk_button = PIXI.Sprite.from(by_walk_button);
    this.by_walk_button.interactive = true;
    this.by_walk_button.buttonMode = true;
    this.by_walk_button.x = 175;
    this.by_walk_button.on('pointertap', () => {
      this.emit('go', this.node_idx, false);
      this.parent.removeChild(this);
    });
    this.addChild(this.by_walk_button);

    this.by_walk_label = new PIXI.Text('', {
      fontSize: 14,
      fontWeight: 400
    });
    this.by_walk_label.alpha = 0.5413;
    this.by_walk_label.position.set(45, 13);
    this.by_walk_button.addChild(this.by_walk_label);

    this.width = 324;
  }

  init(name: string, actions: ActionType[], node_idx: number, distance: number) {
    this.node_idx = node_idx;
    let height = 0;
    this.name_label.text = name;
    this.name_label.updateText(true);
    height += this.name_label.height + 16 + this.name_label.y;
    for (const label of this.action_labels) {
      this.removeChild(label);
    }
    let width = this.name_label.width;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      let action_label;
      const label_text = `• ${action.action_name}`;
      if (this.action_labels[i]) {
        action_label = this.action_labels[i];
        action_label.text = label_text;
      } else {
        action_label = new PIXI.Text(label_text, {
          fontSize: 14,
          fontWeight: 500,
        });
        action_label.x = 36;
        this.action_labels.push(action_label);
      }
      action_label.updateText(true);
      action_label.y = height;
      this.addChild(action_label);

      height += action_label.height + 2.41;
      width = Math.max(action_label.width, width);
    }

    this.by_walk_label.text = `${Math.round(distance / constant.WALK_SPEED)} 분`;
    this.by_walk_button.y = this.by_car_button.y = height + 16;

    if (distance >= constant.CAR_MIN_DIST) {
      this.by_car_label.text = `${Math.round(distance / constant.CAR_SPEED)} 분`;
      this.by_car_button.visible = true;
    } else {
      this.by_car_button.visible = false;
    }

    this.height = height + this.by_walk_button.height + 37;
    this.pivot.set(-40, this.height + 90);
  }
}
