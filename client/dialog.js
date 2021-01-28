export default class Dialog extends PIXI.Container {
  constructor() {
    super();
    /** @memeber */
    this.frame = new PIXI.Graphics();
    this.addChild(this.frame);
    /** @member */
    this.name_label = new PIXI.Text("", {
      fontSize: 30,
    });
    this.name_label.position.set(10, 10);
    this.addChild(this.name_label);
    /** @member {PIXI.Text[]}*/
    this.action_labels = [];
    this.do_button = new PIXI.Graphics();
    this.do_button.interactive = true;
    this.do_button.buttonMode = true;
    this.addChild(this.do_button);
  }

  /**
   *
   * @param {string} name
   * @param {string[]} actions
   */
  init(name, actions) {
    let height = 0;
    this.name_label.text = name;
    this.name_label.updateText();
    height += this.name_label.height + 10;
    this.action_labels = [];
    let width = this.name_label.width;
    for (const action of actions) {
      const action_label = new PIXI.Text(action);
      action_label.updateText();
      action_label.position.set(20, height);
      this.addChild(action_label);
      height += this.name_label.height + 10;
      this.action_labels.push(action_label);
      width = Math.max(action_label.width, width);
    }

    this.frame.clear();
    this.frame.beginFill(0x0000cc, 1);
    this.frame.drawRoundedRect(0, 0, width + 30, height + 70, 10);

    this.do_button.clear();
    this.do_button.beginFill(0x330000, 1);
    this.do_button.drawRoundedRect(10, 10, width + 10, 50, 10);
    this.do_button.position.set(0, height - 20);
  }
}
