const PIXI = require('pixi.js');
window.PIXI = PIXI;
require('pixi-projection');
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

const map = new Map(require('./map.json'));
container.addChild(map);

app.ticker.add((delta) => {
});
