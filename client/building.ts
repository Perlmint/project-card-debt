import TEXTURES from 'game-asset-glob!./res/buildings_on_tile/*.png';
import ui_data from './res/building/id.json';
import data from '../data/building.json';

export type BuildingId = keyof (typeof data);

export {
  TEXTURES,
  ui_data,
  data
};
