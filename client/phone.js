const background = PIXI.Texture.from(require('./res/phone.png'));
const news_background = PIXI.Texture.from(require('./res/alarm.png'));
const target_item = PIXI.Texture.from(require('./res/target_item.png'));
const target_item_highlight = PIXI.Texture.from(require('./res/target_item_highlight.png'));
const ScrollContainer = require('./scroll_container').default;
const ProgressBar = require('./progress_bar').default;
const map = require('lodash/map');
const filter = require('lodash/filter');
const includes = require('lodash/includes');
const target_data = require('./target.json');
const action_data = require('./action.json');
const { data: building_data, textures: building_textures, ui_data: building_ui_data } = require('./building');

class Alarm extends PIXI.Sprite {
  constructor(title) {
    super(news_background);

    this.title = new PIXI.Text(title, {
      fontWeight: '500',
      fontSize: 20,
    });
    this.title.position.set(27, 32);
    this.addChild(this.title);
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

    const actions = map(filter(action_data, (o) => includes(o.targets, id)), o => o.action_id);
    const buildings = filter(building_data, o => {
      for (const action of actions) {
        if (includes(o.actions, action)) {
          return true;
        }
      }

      return false;
    });
    buildings.sort();
    map(buildings, (building, idx) => {
      const cont = new PIXI.Container();
      const bg = new PIXI.Graphics();
      bg.beginFill(0xECECEC, 1);
      bg.drawRect(0, 0, 50, 50);
      cont.addChild(bg);
      const sprt = new PIXI.Sprite(building_textures[building_ui_data[building.building_id].name]);
      sprt.anchor.set(0.5, 0.5);
      sprt.position.set(25, 25);
      console.log(sprt.height);
      const scale = 48 / Math.max(sprt.width, sprt.height);
      sprt.scale.set(scale, scale);
      cont.addChild(sprt);
      cont.cacheAsBitmap = true;
      cont.position.set(95 + idx * (16 + 50), 67);
      this.addChild(cont);
    });
  }

  setComplete() {
    this.texture = target_item_highlight;
    this.title.style.fill = '#4A9692';
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
    });
    this.title.position.set(240, 95);
    this.title.anchor.set(0.5, 0);
    this.addChild(this.title);

    this.innerView = new ScrollContainer(31, 286, 440, 688, 218);
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

  initTodo(todo) {
    this.innerView.itemHeight = 154;
    this.targets = new Map();
    this.title.text = `${todo.todo_name} 임무 수행 가이드`;
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
      this.completed++;
      target.setComplete();
      const progress = this.completed / this.targets.size;
      this.percentage.text = `${Math.round(progress * 100)}%`
      this.progress_bar.setProgress(progress);
    }
  }
}
