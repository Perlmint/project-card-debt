const PIXI = require('pixi.js');
const Map = require('./map').default;

// TODO: fill window
const app = new PIXI.Application({
    backgroundColor: 0x1099bb,
    resolution: window.devicePixelRatio || 1,
});
document.body.appendChild(app.view);

const container = new PIXI.Container();

app.stage.addChild(container);

const map = new Map(require('./map.json'));

container.addChild(map);

app.ticker.add((delta) => {
});
