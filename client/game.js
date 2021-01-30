const PIXI = require('pixi.js');
window.PIXI = PIXI;
require('pixi-projection');
require('pixi-layers');
const PUXI = require('@puxi/core');
const Phone = require('./phone').default;
const Map = require('./map').default;
const CountDownTimer = require('./countdown').default;
const target_data = require('./target.json');

// TODO: fill window
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x1099bb,
});
document.body.appendChild(app.view);

const container = new PIXI.Container();

app.stage = new PIXI.display.Stage();
app.stage.addChild(container);

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
  ui_container.resize(window.innerWidth, window.innerHeight);
});

const ws = new WebSocket(`ws://${location.host}/game${location.search}`);
ws.addEventListener('close', (event) => {
  if (event.reason === 'not_found') {
    location.href = '/';
  }
});
ws.addEventListener('message', (message) => {
  const data = JSON.parse(message.data);
  switch (data.type) {
    case 'init': {
      const map = new Map(data.map, data.user_data.pos, data.user_data.role);
      map.ui_root.position.x = phone.width;
      container.addChildAt(map.ui_root, 0);
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
      timer.once('end', () => ws.send(JSON.stringify({
        type: 'end',
      })));
      timer.start();
      break;
    }
    case 'target_noti':
      for (const target of data.targets) {
        phone.addNews(target_data[target].target_name);
      }
      break;
    case 'montage':
      phone.addMontage(data.montage);
      break;
    case 'capture':
      alert('capture!');
      break;
    case 'tick_req':
      ws.send(JSON.stringify({
        type: 'tick_resp',
        time: timer.remain,
      }));
      break;
    case 'tick_resp':
      timer.remain = data.time;
      break;
  }
});

app.ticker.add((delta) => {
});
