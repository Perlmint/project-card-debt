const PIXI = require('pixi.js');
window.PIXI = PIXI;
require('pixi-projection');
require('pixi-layers');
const Phone = require('./phone').default;
const Map = require('./map').default;

// TODO: fill window
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x1099bb,
});
document.body.appendChild(app.view);
window.addEventListener('resize', (e) => {
  app.resizeTo = window;
});

const container = new PIXI.Container();

app.stage.addChild(container);

const ui_layer = PIXI.display.Layer();

const phone = new Phone();
container.addChild(phone);

const ws = new WebSocket(`ws://${location.host}/game${location.search}&user=${document.cookie.session}`);
ws.addEventListener('close', (event) => {
  if (event.reason === 'not_found') {
    location.href = '/';
  }
});
ws.addEventListener('message', (message) => {
  const data = JSON.parse(message.data);
  switch (data.type) {
    case 'init': {
      const map = new Map(data.map, data.pos);
      map.ui_root.position.x = phone.width;
      container.addChild(map.ui_root);
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
      break;
    }
    case 'tick': {
      break;
    }
  }
});

app.ticker.add((delta) => {
});
