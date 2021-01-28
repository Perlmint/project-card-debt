export const PUXI = require('@puxi/tween');

export const SharedTweenManager = new PUXI.TweenManager(true);
export default SharedTweenManager;
PUXI.EaseLinear = (t) => t;
