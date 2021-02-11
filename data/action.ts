import data from './action.json';

export type ActionId = keyof (typeof data);
export type ActionType = (typeof data)[ActionId];

export default data;
