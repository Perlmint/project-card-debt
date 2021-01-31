const PIXI = require('pixi.js');
const mapValues = require('lodash/mapValues');

export const textures = mapValues(
  require('./res/buildings_on_tile/*.png'),
  (v) => PIXI.Texture.from(v)
);
export const ui_data = require('./res/building/id.json');
export const data = require('./building.json');
