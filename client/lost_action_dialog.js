const EventEmitter = require('eventemitter3');
export default class ActionDialog extends EventEmitter {
  constructor() {
    super();
    this.root = new PIXI.Container();
    this.root.on('pointertap', () => {
      this.root.parent.removeChild(this.root);
    });
    /** @memeber */
    this.frame = new PIXI.Graphics();
    this.root.addChild(this.frame);
    /** @member */
    this.name_label = new PIXI.Text("", {
      fontSize: 30,
    });
    this.name_label.position.set(10, 10);
    this.root.addChild(this.name_label);
    /** @member {PIXI.Text[]}*/
    this.action_labels = [];
    this.do_button = new PIXI.Graphics();
    this.do_button.interactive = true;
    this.do_button.buttonMode = true;
    this.do_button.on('pointertap', () => {
      this.root.parent.removeChild(this.root);
    })
    this.root.addChild(this.do_button);
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
    height += this.name_label.height + 10;
    for (const label of this.action_labels) {
      this.root.removeChild(label);
    }
    let width = this.name_label.width;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      let action_label;
      if (this.action_labels[i]) {
        action_label = this.action_labels[i];
        action_label.text = action.action_name;
        action_label.removeAllListeners();
      } else {
        action_label = new PIXI.Text(action.action_name);
        action_label.interactive = true;
        action_label.buttonMode = true;
        this.action_labels.push(action_label);
        const action_id = action.action_id;
        action_label.on('pointertap', () => {
          this.emit('do', action_id);
          this.root.parent.removeChild(this.root);
        });
      }
      action_label.updateText();
      action_label.position.set(20, height);
      this.root.addChild(action_label);
      height += this.name_label.height + 10;
      width = Math.max(action_label.width, width);
    }

    this.frame.clear();
    this.frame.beginFill(0xcc0000, 1);
    this.frame.drawRoundedRect(0, 0, width + 30, height + 70, 10);

    this.do_button.clear();
    this.do_button.beginFill(0x003300, 1);
    this.do_button.drawRoundedRect(10, 10, width + 10, 50, 10);
    this.do_button.position.set(0, height - 20);
    this.root.pivot.set(-40, height + 90);
  }
}
