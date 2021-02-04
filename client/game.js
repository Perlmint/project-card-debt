const PIXI = require('pixi.js');
window.PIXI = PIXI;
require('pixi-projection');
const PUXI = require('@puxi/core');
const Phone = require('./phone').default;
const Map = require('./map').default;
const CountDownTimer = require('./countdown').default;
const mapValues = require('lodash/mapValues');
const result_scene = mapValues(require("./res/result/*.png"), p => PIXI.Texture.from(p));

// TODO: fill window
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x1099bb,
});
document.body.appendChild(app.view);

const container = new PIXI.Container();

app.stage.addChild(container);
window.app = app;

const ui_container = new PIXI.Container();
ui_container.interactive = false;
ui_container.interactiveChildren = true;
container.addChild(ui_container);

const phone = new Phone();
ui_container.addChild(phone);

const timer = new CountDownTimer();
timer.root.position.set(window.innerWidth, 0);
container.addChild(timer.root);

window.addEventListener('resize', (e) => {
  app.resizeTo = window;
  timer.root.position.set(window.innerWidth, 0);
});

const ws = new WebSocket(`${location.protocol.replace('http', 'ws')}//${location.host}/game${location.search}`);
ws.addEventListener('close', (event) => {
  if (event.reason === 'not_found') {
    location.href = '/';
  }
});

let role;

ws.addEventListener('message', (message) => {
  const data = JSON.parse(message.data);
  switch (data.type) {
    case 'init': {
      const map = new Map(data.map, data.user_data);
      map.ui_root.position.x = phone.width;
      container.addChildAt(map.ui_root, 0);
      role = data.user_data.role;
      map.on('player_arrival', (pos) => {
        ws.send(JSON.stringify({
          type: 'arrival',
          time: timer.remain,
          pos,
        }));
      });
      map.on('player_depature', () => {
        ws.send(JSON.stringify({
          type: 'depature',
        }));
      });
      map.on('target_noti', (targets, node, montage_init, montage_decay, post_delay) => {
        for (const t of targets) {
          phone.completeTarget(t);
        }
        ws.send(JSON.stringify({
          type: 'target_noti',
          targets,
          montage_init,
          montage_decay,
          post_delay,
          node,
          time: timer.remain,
        }));
      });
      map.on('montage', (node) => {
        ws.send(JSON.stringify({
          type: 'ask',
          node,
          time: timer.remain,
        }));
      });
      map.on('car', (building) => {
        ws.send(JSON.stringify({
          type: 'car',
          building,
          time: timer.remain,
        }));
      })
      if (data.user_data.todo) {
        phone.initTodo(data.user_data.todo);
        if (data.user_data.completed_targets) {
          for (const target of data.user_data.completed_targets) {
            phone.completeTarget(target);
          }
        }
      } else {
        phone.initForLost();
      }
      timer.once('end', () => ws.send(JSON.stringify({
        type: 'end',
      })));
      timer.start();
      break;
    }
    case 'target_noti':
      for (const target of data.targets) {
        phone.addTargetNews(target, data.time);
      }
      break;
    case 'montage':
      phone.addMontage(data.montage);
      break;
    case 'win':
    case 'defeat': {
      timer.stop();
      const scene = new PIXI.Sprite(result_scene[`${role}_${data.type}`]);
      scene.anchor.set(0.5, 0.5);
      scene.position.set(window.innerWidth / 2, window.innerHeight / 2);
      container.interactive = container.buttonMode = true;
      container.on('pointertap', () => {
        location.href = '/';
      });
      container.addChild(scene);
      break;
    }
    case 'tick_req':
      ws.send(JSON.stringify({
        type: 'tick_resp',
        time: timer.remain,
      }));
      break;
    case 'tick_resp':
      timer.remain = data.time;
      break;
    case 'car':
      phone.addCarNews(data.building, data.time);
      break;
  }
});

app.ticker.add((delta) => {
});
