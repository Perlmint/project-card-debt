import * as PIXI from 'pixi.js';
import mapValues from 'lodash/mapValues';

export const textures = mapValues(
  require('./res/buildings_on_tile/*.png'),
  (v) => PIXI.Texture.from(v)
);
import ui_data from './res/building/id.json';
import data from '../data/building.json';

export type BuildingId = keyof (typeof data);

export {
  ui_data,
  data
};
