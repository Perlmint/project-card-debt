import data from './target.json';

export type TargetId = keyof typeof data;
export type TargetType = (typeof data)[TargetId];
export default data;
