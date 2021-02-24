import './init_pixi';
import 'webpack-game-asset-plugin/loader';
import * as PIXI from 'pixi.js';
import Phone from './phone';
import Map from './map';
import CountDownTimer from './timer';
import { values } from 'lodash';
import TWEEN from '@tweenjs/tween.js';
import { RESOURCE_CONFIG_URL } from 'webpack-game-asset-plugin/helper';
import result_scene from "game-asset-glob!./res/result/*.png";
import { ResultView } from './result';

// TODO: fill window
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x1099bb,
});
document.body.appendChild(app.view);
window.app = app;

function gameEntry() {
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
        const scene = new ResultView(data.type, role);
        scene.position.set(window.innerWidth / 2 - scene.width / 2, window.innerHeight / 2 - scene.height / 2);
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
}

(async function() {
  const res_meta = await fetch(RESOURCE_CONFIG_URL);
  const res_meta_obj = await res_meta.json();
  for (const res of values(res_meta_obj.atlas)) {
    app.loader.add(res);
  };
  app.loader.load(gameEntry);
})();