import { createHeadTexture } from './player';

const background = PIXI.Texture.from(require('./res/phone.png'));
const news_background = PIXI.Texture.from(require('./res/alarm.png'));
const target_item = PIXI.Texture.from(require('./res/target_item.png'));
const target_item_highlight = PIXI.Texture.from(require('./res/target_item_highlight.png'));
const triangle = PIXI.Texture.from(require('./res/triangle.png'));
const check = PIXI.Texture.from(require('./res/check.png'));
const empty_check = PIXI.Texture.from(require('./res/empty_check.png'));
const ScrollContainer = require('./scroll_container').default;
const ProgressBar = require('./progress_bar').default;
const each = require('lodash/each');
const map = require('lodash/map');
const mapValues = require('lodash/mapValues');
const filter = require('lodash/filter');
const includes = require('lodash/includes');
const target_data = require('./target.json');
const action_data = require('./action.json');
const todo_data = require('../data/todo.json');
const constants = require('./const.json');
const sprintf = require('sprintf-js').sprintf;
const { data: building_data, textures: building_textures, ui_data: building_ui_data } = require('./building');
const montage_textures = mapValues(require('./res/montage/*.png'), o => PIXI.Texture.from(o));
const { body: body_textures, leg: leg_textures } = require('./player');

function createBuildingIcon(building_id) {
  const cont = new PIXI.Container();
  const bg = new PIXI.Graphics();
  bg.beginFill(0xECECEC, 1);
  bg.drawRect(0, 0, 50, 50);
  cont.addChild(bg);
  const sprt = new PIXI.Sprite(building_textures[building_ui_data[building_id].name]);
  sprt.anchor.set(0.5, 0.5);
  sprt.position.set(25, 25);
  const scale = 48 / Math.max(sprt.width, sprt.height);
  sprt.scale.set(scale, scale);
  cont.addChild(sprt);
  cont.cacheAsBitmap = true;

  return cont;
}

function collectBuildingIdsFromTarget(id) {
  const actions = map(filter(action_data, (o) => includes(o.targets, id)), o => o.action_id);
  const buildings = filter(building_data, o => {
    for (const action of actions) {
      if (includes(o.actions, action)) {
        return true;
      }
    }

    return false;
  }).map(b => b.building_id);

  buildings.sort();

  return buildings;
}

class TargetPreviewItem extends PIXI.Graphics {
  constructor() {
    super();

    this.beginFill(0xFFFFFF, 1);
    this.lineStyle(1, 0xC4C4C4);
    this.drawRect(0, 0, 440, 80);
    this.endFill();
    this.cacheAsBitmap = true;

    this.checkbox = new PIXI.Sprite();
    this.checkbox.position.set(20, 20);
    this.addChild(this.checkbox);

    this.title = new PIXI.Text('', {
      fontSize: 16,
    });
    this.title.position.set(76, 31);
    this.addChild(this.title);
  }

  init(target, completed) {
    if (completed) {
      this.checkbox.texture = check;
      this.title.style.fill = '#4A9692';
      this.title.style.fontWeight = 700;
    } else {
      this.checkbox.texture = empty_check;
      this.title.style.fill = '#000000';
      this.title.style.fontWeight = 400;
    }

    this.title.text = target.target_name;
  }
}

class Alarm extends PIXI.NineSlicePlane {
  constructor(time, id, is_target) {
    super(news_background, 32, 32, 32, 32);

    time = constants.TOTAL_TIME - time / 1000 / constants.TIME_MULTIPLIER;

    this.x = 11;
    this.title = new PIXI.Text(sprintf('%02d:%02d', time / 60, time % 60), {
      fontWeight: 500,
      fontSize: 20,
    });
    this.width = 424;
    this.title.position.set(27, 32);
    this.addChild(this.title);

    let content_text;
    let buildings;
    if (is_target) {
      const target = target_data[id];
      content_text = `[${target.target_name}] 사건 발생`;
      buildings = collectBuildingIdsFromTarget(id);
    } else {
      buildings = [id];
      content_text = `차량 강도 제보\n범인은 [${building_data[id].name}]을 향해...`;
    }
    this.content = new PIXI.Text(content_text, {
      fontWeight: 400,
      fontSize: 16,
    });
    this.content.alpha = 0.5413;
    this.content.position.set(32, 67);
    this.addChild(this.content);

    each(buildings, (id, idx) => {
      const item = createBuildingIcon(id);
      item.position.set(32 + idx * (16 + 50), this.content.height + 67 + 16);
      this.addChild(item);
    });

    this.height = this.content.height + 67 + 103;
  }
}

class TargetItem extends PIXI.Sprite {
  constructor(id) {
    super(target_item);

    const data = target_data[id];

    this.title = new PIXI.Text(data.target_name, {
      fontSize: 20,
      fontWeight: 700
    });
    this.title.position.set(95, 27);
    this.addChild(this.title);

    each(collectBuildingIdsFromTarget(id), (id, idx) => {
      const item = createBuildingIcon(id);
      item.position.set(95 + idx * (16 + 50), 67);
      this.addChild(item);
    });
  }

  setComplete() {
    if (this.texture === target_item_highlight) {
      return false;
    }

    this.texture = target_item_highlight;
    this.title.style.fill = '#4A9692';
    return true;
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

    this.title = new PIXI.Text('', {
      fontWeight: 700,
      fontSize: 20,
      align: 'center',
      fill: '#FFFFFF',
    });
    this.title.anchor.set(0.5, 0);
    this.addChild(this.title);

    this.innerView = new ScrollContainer(20, 286, 440, 688, 218);
    this.addChild(this.innerView.po);
  }

  initForLost() {
    this.title.anchor.y = 0.5;
    this.title.position.set(240, 67 + 12);

    this.triangle = new PIXI.Sprite(triangle);
    this.triangle.pivot.set(0, triangle.height / 2);
    this.triangle.position.y = this.title.position.y;
    this.addChild(this.triangle);

    this.toggle_area = new PIXI.Container();
    this.toggle_area.buttonMode = this.toggle_area.interactive = true;
    this.toggle_area.hitArea = new PIXI.Rectangle(0, 0, 440, 42);
    this.toggle_area.on('pointertap', () => this.toggle_screen());
    this.toggle_area.position.set(20, 58);
    this.addChild(this.toggle_area);

    this.montage_ui = new PIXI.Container();
    this.montage_ui.visible = false;
    this.addChild(this.montage_ui);

    const montage_bg = new PIXI.Graphics();
    montage_bg.beginFill(0x7E7E7E, 1);
    montage_bg.drawCircle(50, 50, 50);
    montage_bg.drawCircle(82 + 50, 50, 50);
    montage_bg.drawCircle(158 + 50, 50, 50);
    montage_bg.endFill();
    montage_bg.cacheAsBitmap = true;
    montage_bg.position.set(111, 120);
    this.montage_ui.addChild(montage_bg);

    this.montage_components = {
      hair: new PIXI.Sprite(),
      hair_empty: new PIXI.Sprite(montage_textures.hair_empty),
      body: new PIXI.Sprite(),
      body_empty: new PIXI.Sprite(montage_textures.body_empty),
      leg: new PIXI.Sprite(),
      leg_empty: new PIXI.Sprite(montage_textures.leg_empty),
    };
    this.montage_components.hair.anchor.set(0.5, 0.5);
    this.montage_components.hair.position.set(111 + 50, 120 + 50);
    this.montage_ui.addChild(this.montage_components.hair);
    this.montage_components.hair_empty.anchor.set(0.5, 0.5);
    this.montage_components.hair_empty.position.set(111 + 50, 120 + 50);
    this.montage_ui.addChild(this.montage_components.hair_empty);

    this.montage_components.body.anchor.set(0.5, 0.5);
    this.montage_components.body.position.set(111 + 82 + 50, 120 + 50);
    this.montage_ui.addChild(this.montage_components.body);
    this.montage_components.body_empty.anchor.set(0.5, 0.5);
    this.montage_components.body_empty.position.set(111 + 82 + 50, 120 + 50);
    this.montage_ui.addChild(this.montage_components.body_empty);

    this.montage_components.leg.anchor.set(0.5, 0.5);
    this.montage_components.leg.position.set(111 + 158 + 50, 120 + 50);
    this.montage_ui.addChild(this.montage_components.leg);
    this.montage_components.leg_empty.anchor.set(0.5, 0.5);
    this.montage_components.leg_empty.position.set(111 + 158 + 50, 120 + 50);
    this.montage_ui.addChild(this.montage_components.leg_empty);

    let label = new PIXI.Text('Head', {
      fontWeight: 400,
      fontSize: 16,
    });
    label.anchor.x = 0.5;
    label.position.set(111 + 50, 120 + 100 + 11);
    this.montage_ui.addChild(label);
    label = new PIXI.Text('Body', {
      fontWeight: 400,
      fontSize: 16,
    });
    label.anchor.x = 0.5;
    label.position.set(111 + 82 + 50, 120 + 100 + 11);
    this.montage_ui.addChild(label);
    label = new PIXI.Text('Leg', {
      fontWeight: 400,
      fontSize: 16,
    });
    label.anchor.x = 0.5;
    label.position.set(111 + 158 + 50, 120 + 100 + 11);
    this.montage_ui.addChild(label);

    this.target_ui = new PIXI.Container();
    this.target_ui.visible = false;
    this.addChild(this.target_ui);

    const createTodoButton = (todo) => {
      const label = new PIXI.Text(todo.todo_name, {
        fontWeight: 400,
        fontSize: 16,
      });
      label.alpha = 0.87;
      label.position.set(10, 11);

      const bg = new PIXI.Graphics();
      bg.beginFill(0xFFFFFF, 1);
      bg.drawRoundedRect(0, 0, label.width + 10 + 10, label.height + 11 + 10, 10);
      bg.addChild(label);
      bg.interactive = bg.buttonMode = true;
      bg.on('pointertap', () => {
        this.showTodoList(todo.todo_id - 1);
      });

      return bg;
    };

    const todo_button_positions = {
      1: new PIXI.Point(100, 108),
      4: new PIXI.Point(248, 108),
      7: new PIXI.Point(40,  164),
      2: new PIXI.Point(171, 164),
      5: new PIXI.Point(302, 164),
      3: new PIXI.Point(87, 220),
      6: new PIXI.Point(250, 220),
    };
    for (let idx = 0; idx < todo_data.length; idx++) {
      const todo = todo_data[idx];
      const todo_item = createTodoButton(todo);
      todo_item.position = todo_button_positions[todo.todo_id];
      this.target_ui.addChild(todo_item);
    }

    this.todo_id = 1;
    this.news_items = [];
    this.target_items = [];
    this.completed_target_ids = new Set();

    this.updateMontage();
    this.toggle_screen();
  }

  showTodoList(todo_id) {
    this.innerView.removeChildren();
    this.todo_id = todo_id;

    const targets = todo_data[todo_id].targets;
    for (let idx = 0; idx < targets.length; idx++) {
      let target_item = this.target_items[idx];
      if (!target_item) {
        target_item = new TargetPreviewItem();
      }
      target_item.init(target_data[targets[idx]], this.completed_target_ids.has(targets[idx]));
      this.innerView.addItem(target_item);
    }
  }

  toggle_screen() {
    if (this.montage_ui.visible) {
      this.montage_ui.visible = false;
      this.target_ui.visible = true;
      this.title.text = '임무 리스트';
      this.triangle.rotation = Math.PI;
      this.triangle.x = this.title.position.x - this.title.width / 2 - 5;
      this.innerView.itemHeight = 80;
      this.showTodoList(this.todo_id);
    } else {
      this.montage_ui.visible = true;
      this.target_ui.visible = false;
      this.title.text = 'WANTED';
      this.triangle.rotation = 0;
      this.triangle.x = this.title.position.x + this.title.width / 2 + 5;
      this.innerView.itemHeight = 218;
      this.innerView.removeChildren();
      for (const item of this.news_items) {
        this.innerView.addItem(item);
      }
    }
  }

  addTargetNews(target_id, time) {
    this.completed_target_ids.add(target_id);
    const alarm = new Alarm(time, target_id, true);
    this.news_items.push(alarm);
    this.innerView.addItem(alarm);
  }

  addCarNews(building_id, time) {
    const alarm = new Alarm(time, building_id, false);
    this.news_items.push(alarm);
    this.innerView.addItem(alarm);
  }

  addMontage(montage) {
    Object.assign(this.montage, montage);
    this.updateMontage();
  }

  updateMontage() {
    for (const part of ['hair', 'body', 'leg']) {
      const color = this.montage[`${part}_color`];
      const shape = this.montage[`${part}_type`];
      const component = this.montage_components[part];
      const empty_component = this.montage_components[`${part}_empty`];
      if (color === null && shape === null) {
        component.visible = false;
        empty_component.visible = true;
      } else if (shape === null) {
        component.visible = true;
        component.texture = montage_textures[`${part}_color`];
        component.tint = color;
        component.scale.set(1, 1);
        empty_component.visible = true;
      } else if (color === null) {
        component.visible = true;
        component.texture = montage_textures[`${part}_shape_${shape}`];
        component.scale.set(1, 1);
        empty_component.visible = false;
      } else {
        component.visible = true;
        switch (part) {
          case 'hair':
            component.texture = createHeadTexture(this.montage, 0.34);
            break;
          case 'body':
            component.texture = body_textures[shape];
            component.tint = color;
            component.scale.set(0.3, 0.3);
            break;
          case 'leg':
            component.texture = leg_textures[shape];
            component.tint = color;
            component.scale.set(0.3, 0.3);
            break;
        }
        empty_component.visible = false;
      }
    }
  }

  initTodo(todo) {
    this.innerView.itemHeight = 154;
    this.targets = new Map();
    this.title.text = `${todo.todo_name} 임무 수행 가이드`;
    this.title.position.set(240, 95);
    this.percentage = new PIXI.Text('0%', {
      fontWeight: 700,
      fontSize: 60,
    });

    this.completed = 0;
    this.percentage.position.set(160, 135);
    this.addChild(this.percentage);

    this.progress_bar = new ProgressBar();
    this.progress_bar.position.set(160, 208);
    this.progress_bar.resize(280, 27, 0xC4C4C4, 0x626262, 0x7E7E7E, 4);

    this.addChild(this.progress_bar);

    for (const target of todo.targets) {
      const target_item = new TargetItem(target);
      this.innerView.addItem(target_item);
      this.targets.set(target, target_item);
    }
  }

  completeTarget(target_id) {
    const target = this.targets.get(target_id);
    if (target) {
      if (target.setComplete()) {
        this.completed++;
        const progress = this.completed / this.targets.size;
        this.percentage.text = `${Math.round(progress * 100)}%`
        this.progress_bar.setProgress(progress);
      }
    }
  }
}
