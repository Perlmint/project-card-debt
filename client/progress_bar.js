const PIXI = require('pixi.js');
const constants = require('./const.json');
const sprintf = require('sprintf-js').sprintf;
const EventEmitter = require('eventemitter3');
const { SharedTweenManager, PUXI } = require('./tween');

export default class ProgressBar extends EventEmitter{
  constructor() {
	super();
	this.root = new PIXI.Container();
	
	let rect_width = 100;
	let rect_height = 100;

	/** @member */
	this.background = new PIXI.Graphics();
	this.background.drawRect(0,0,rect_width,rect_height); // todo: change it!
	this.root.addChild(this.background);
	
	/** @member */
	this.bar = new PIXI.Graphics();
	this.root.addChild(this.bar);
	
	/** @member */
	this.remain_time = new PIXI.Text('00:00', {
		fontSize: 20,
	});
	this.remain_time.position.set(rect_width / 2.0, rect_height / 2.0);
	this.remain_time.anchor.set(0.5, 0.5);
	this.root.addChild(this.remain_time);
  }

  /**
   * 
   * @param {number} time_sec 
   * @param {number} width 
   * @param {number} height 
   * @param {any} complete  
   */
  init(time_sec, width, height, complete = null) {

	this.width = width;
	this.height = height;

	this.root.position.set(50, 50);

	this.background.clear();
	this.background.beginFill(0x222222, 1);
	this.background.drawRect(0, 0, width, height);
	
	this.bar.clear();
	this.bar.beginFill(0xFFFF00, 1);
	this.bar.drawRect(0, 0, 0, height);
	
	this.remain_time.position.set(100 / 2.0, 50 / 2.0);
	this.remain_time.anchor.set(0.5, 0.5);

	this.initial_time = time_sec * 1000;	
    this.remain = this.initial_time;

	SharedTweenManager.tween(
		this.initial_time,
		0,
		90 * constants.TIME_MULTIPLIER,
		PUXI.NumberErp,
		PUXI.EaseLinear
	).target(this, "remain").on('update', ()=> {
		this.remain_time.text = sprintf(
			'%02d:%02d',
			this.remain / 60 / 1000,
			this.remain / 1000 % 60
		  );
		
		this.bar.clear();
		this.bar.beginFill(0xFFFFFF, 1);
		this.bar.drawRect(
			0, 
			0, 
			this.width * (this.remain / this.initial_time), 
			this.height
		);
	}).on('complete', () => {
		this.root.parent.removeChild(this.root);
		if (complete != null && typeof complete === "function") {
		  complete();
		}
	});
  }
}