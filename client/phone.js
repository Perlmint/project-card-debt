const background = PIXI.Texture.from(require('./res/phone.png'));
const news_background = PIXI.Texture.from(require('./res/alarm.png'));
const target_item = PIXI.Texture.from(require('./res/target_item.png'));
const target_item_highlight = PIXI.Texture.from(require('./res/target_item_highlight.png'));
const ScrollContainer = require('./scroll_container').default;
const ProgressBar = require('./progress_bar').default;
const each = require('lodash/each');
const map = require('lodash/map');
const filter = require('lodash/filter');
const includes = require('lodash/includes');
const target_data = require('./target.json');
const action_data = require('./action.json');
const constants = require('./const.json');
const sprintf = require('sprintf-js').sprintf;
const { data: building_data, textures: building_textures, ui_data: building_ui_data } = require('./building');

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

class Alarm extends PIXI.NineSlicePlane {
  constructor(time, id, is_target) {
    super(news_background, 32, 32, 32, 32);

    time = constants.TOTAL_TIME - time / 1000;

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
    });
    this.title.anchor.set(0.5, 0);
    this.addChild(this.title);

    this.innerView = new ScrollContainer(31, 286, 440, 688, 218);
    this.addChild(this.innerView.po);
  }

  initForLost() {
    this.title.text = "WANTED";
    this.title.position.set(240, 67);

    const montage_bg = new PIXI.Graphics();
    montage_bg.beginFill(0x7E7E7E, 1);
    montage_bg.drawCircle(50, 50, 50);
    montage_bg.drawCircle(82 + 50, 50, 50);
    montage_bg.drawCircle(158 + 50, 50, 50);
    montage_bg.endFill();
    montage_bg.cacheAsBitmap = true;
    montage_bg.position.set(111, 120);
    this.addChild(montage_bg);
  }

  addNews(target_id, time) {
    const alarm = new Alarm(time, target_id, true);
    this.innerView.addItem(alarm);
  }

  addMontage(montage) {
    Object.assign(this.montage, montage);
    console.log(montage);
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
