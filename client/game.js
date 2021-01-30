const PIXI = require('pixi.js');
window.PIXI = PIXI;
require('pixi-projection');
require('pixi-layers');
const Phone = require('./phone').default;
const Map = require('./map').default;
const CountDownTimer = require('./countdown').default;

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

const phone = new Phone();
container.addChild(phone);

const timer = new CountDownTimer();
timer.root.position.set(window.innerWidth, 0);
container.addChild(timer.root);

window.addEventListener('resize', (e) => {
  app.resizeTo = window;
  timer.root.position.set(window.innerWidth, 0);
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
      const map = new Map(data.map, data.user_data.pos);
      map.ui_root.position.x = phone.width;
      container.addChildAt(map.ui_root, 0);
      map.on('player_arrival', (pos) => {
        ws.send(JSON.stringify({
          type: 'arrival',
          pos,
        }));
      });
      map.on('player_depature', () => {
        ws.send(JSON.stringify({
          type: 'depature',
        }));
      });
      map.on('target_noti', (targets) => {
        ws.send(JSON.stringify({
          type: 'target_noti',
          targets,
        }));
      })
      timer.once('end', () => ws.send(JSON.stringify({
        type: 'end',
      })));
      timer.start();
      break;
    }
    case 'target_noti':
      console.log(data.targets);
      break;
    case 'tick': {
      break;
    }
  }
});

app.ticker.add((delta) => {
});
