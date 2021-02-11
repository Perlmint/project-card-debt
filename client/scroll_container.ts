import * as PIXI from 'pixi.js';

export default class ScrollContainer extends PIXI.Container {
  scrollContainer: PIXI.Container;
  items: PIXI.DisplayObject[];
  itemHeight: number;
  contents_mask: PIXI.Graphics;
  mousedown: boolean;
  lastPos?: number;
  lastDiff?: number;
  constructor(width: number, height: number, itemHeight: number) {
    super();

    this.scrollContainer = new PIXI.Container();
    this.addChild(this.scrollContainer);
    this.items = [];

    this.hitArea = new PIXI.Rectangle(0, 0, width, height);
    this.itemHeight = itemHeight;

    this.contents_mask = new PIXI.Graphics();
    this.contents_mask
      .beginFill(0xFFFFFF)
      .drawRect(0, 0, width, height)
      .endFill();

    this.addChild(this.contents_mask);
    this.scrollContainer.mask = this.contents_mask;

    this.mousedown = false;

    this.interactive = true;
    this.on('pointermove', (e: PIXI.InteractionEvent) => this.onpointermove(e));
    this.on('pointerdown', (e: PIXI.InteractionEvent) => this.onpointerdown(e));
    this.on('pointerup', () => this.onpointerup());
    this.on('pointerupoutside', () => this.onpointerup());
  }

  onpointermove(e: PIXI.InteractionEvent) {
    const y = e.data.getLocalPosition(this).y;

    if (this.mousedown) {
      this.lastDiff = y - this.lastPos!;
      this.lastPos = y;

      if (-this.scrollContainer.y < 0) {
        this.scrollContainer.y += this.lastDiff / 2;
      } else {
        this.scrollContainer.y += this.lastDiff;
      }
    }
  }

  onpointerdown(e: PIXI.InteractionEvent) {
    const y = e.data.getLocalPosition(this).y;
    this.mousedown = true;
    this.lastPos = y;
  }

  onpointerup() {
    if (this.lastDiff) {
      // let goY = this.scrollContainer.y + this.lastDiff * 10;
      // let ease = Quad.easeOut;
      // let time = Math.abs(this.lastDiff / 150);
      // if (goY < -this.items.length * this.itemHeight + this.height + this.y) {
      //   goY = -this.items.length * this.itemHeight + this.height + this.y;
      //   ease = Back.easeOut;
      //   time = 0.1 + Math.abs(this.lastDiff / 150);
      // }
      // if (goY > this.y) {
      //   goY = this.y;
      //   ease = Back.easeOut;
      //   time = 0.1 + Math.abs(this.lastDiff / 150);
      // }

      // if (this.scrollContainer.y > 0) {
      //   time = 1 + this.scrollContainer.y / 500;
      //   ease = Elastic.easeOut;
      // }
      // if (this.scrollContainer.y < -this.items.length * this.itemHeight + this.height) {
      //   time = 1 + (this.items.length * this.itemHeight + this.height + this.scrollContainer.y) / 500;
      //   ease = Elastic.easeOut;
      // }

      // this.scrollTween = TweenMax.to(this.scrollContainer, time, {
      //   y: goY,
      //   ease
      // });
    }

    this.mousedown = false;
    this.lastPos = undefined;
    this.lastDiff = undefined;
  }

  // This should be called every tick. Use only for scrolling containers with lots of elements for performance.
  hideOffscreenElements() {
    // const startIndex = Math.floor(-(this.scrollContainer.y) / this.itemHeight);
    // const endIndex = Math.floor(startIndex + (this.height / this.itemHeight));
    // for (let i = 0; i < this.items.length; i++) {
    //   const item = this.items[i];
    //   item.visible = false;
    //   if (i >= startIndex && i <= endIndex + 1) {
    //     item.visible = true;
    //   }
    // }
  }

  addItem<T extends PIXI.DisplayObject>(...items: T[]) {
    for (const item of items) {
      this.scrollContainer.addChild(item);
      this.items.push(item);
      item.y = (this.items.length - 1) * this.itemHeight;
    }
  }

  removeItems() {
    this.scrollContainer.removeChildren();
    this.items = [];
  }
}
