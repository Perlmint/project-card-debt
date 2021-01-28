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
  resolution: window.devicePixelRatio || 1,
});
document.body.appendChild(app.view);
window.addEventListener('resize', (e) => {
  app.resizeTo = window;
});

const container = new PIXI.Container();

app.stage.addChild(container);

const phone = new Phone();


container.addChild(phone);

const url = location.search;
const ws = new WebSocket(`ws://${location.host}/ws/${location.search.substr(4)}`);
ws.addEventListener('message', (message) => {
  const data = JSON.parse(message.data);
  switch (data.type) {
    case 'map': {
      const map = new Map(data.map);
      map.position.x = phone.width;
      container.addChild(map);
      break;
    }
  }
});

app.ticker.add((delta) => {
});
