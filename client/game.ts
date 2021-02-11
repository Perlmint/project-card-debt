import './init_pixi';
import * as PIXI from 'pixi.js';
import Phone from './phone';
import Map from './map';
import CountDownTimer from './timer';
import { mapValues } from 'lodash';
import TWEEN from '@tweenjs/tween.js';
const result_scene = mapValues(require("./res/result/*.png") as {[name: string]: string}, (p) => PIXI.Texture.from(p));

// TODO: fill window
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x1099bb,
});
document.body.appendChild(app.view);
window.app = app;

const container = new PIXI.Container();
app.stage.addChild(container);

let timestamp = 0;
app.ticker.add(() => {
  timestamp += app.ticker.deltaMS;
  TWEEN.update(timestamp);
});

const ui_container = new PIXI.Container();
ui_container.interactive = false;
ui_container.interactiveChildren = true;
container.addChild(ui_container);

const phone = new Phone();
ui_container.addChild(phone);

const timer = new CountDownTimer();
timer.position.set(window.innerWidth, 0);
container.addChild(timer);

window.addEventListener('resize', (e) => {
  app.resizeTo = window;
  timer.position.set(window.innerWidth, 0);
});

const ws = new WebSocket(`${location.protocol.replace('http', 'ws')}//${location.host}/game${location.search}`);
ws.addEventListener('close', (event) => {
  if (event.reason === 'not_found') {
    location.href = '/';
  }
});

let role: 'found' | 'lost';

ws.addEventListener('message', (message) => {
  const data = JSON.parse(message.data);
  switch (data.type) {
    case 'init': {
      const map = new Map(data.map, data.user_data);
      map.position.x = phone.width;
      container.addChildAt(map, 0);
      role = data.user_data.role;
      map.on('player_arrival', (pos: number) => {
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
      map.on('target_noti', (targets: number[], node: number, montage_init: number, montage_decay: number, post_delay: number) => {
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
      map.on('montage', (node: number) => {
        ws.send(JSON.stringify({
          type: 'ask',
          node,
          time: timer.remain,
        }));
      });
      map.on('car', (building: number) => {
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
