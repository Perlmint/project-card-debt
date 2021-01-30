const PIXI = require('pixi.js');
const mapValues = require('lodash/mapValues');

export const textures = mapValues(
  require('./res/building/*.png'),
  (v) => PIXI.Texture.from(v)
);
export const ui_data = require('./res/building/id.json');
export const data = require('./building.json');
