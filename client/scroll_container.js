const PIXI = require('pixi.js');

export default class ScrollContainer {
  constructor(x, y, width, height, itemHeight) {
    this.po = new PIXI.Container();
    this.scrollContainer = new PIXI.Container();
    this.po.addChild(this.scrollContainer);
    this.items = [];
    this.x = x;
    this.y = y;

    this.scrollContainer.x = x;
    this.scrollContainer.y = y;
    this.height = height;
    this.itemHeight = itemHeight;

    this.mask = new PIXI.Graphics();
    this.mask
      .beginFill(0xFFFFFF)
      .drawRect(x, y, width, height)
      .endFill();

    this.po.addChild(this.mask);
    this.scrollContainer.mask = this.mask;

    this.mousedown = false;
    this.lastPos = null;
    this.lastDiff = null;
    this.scrollTween = null;

    this.po.interactive = true;
    this.po.mousemove = e => this.onmousemove(e);
    this.po.mousedown = e => this.onmousedown(e);
    this.po.mouseup = e => this.onmouseup(e);
    this.po.mouseupoutside = e => this.onmouseup(e);
    this.po.touchmove = e => this.onmousemove(e);
    this.po.touchstart = e => this.onmousedown(e);
    this.po.touchend = e => this.onmouseup(e);
    this.po.touchendoutside = e => this.onmouseup(e);
  }

  onmousemove(e) {
    const { originalEvent } = e.data;
    var clientY = !originalEvent.touches ? originalEvent.clientY : originalEvent.touches[0].clientY;

    if (this.mousedown) {
      this.lastDiff = clientY - this.lastPos.y;
      this.lastPos.y = clientY;

      if (-this.scrollContainer.y < 0) {
        this.scrollContainer.y += this.lastDiff / 2;
      } else {
        this.scrollContainer.y += this.lastDiff;
      }
    }
  }

  onmousedown(e) {
    const { originalEvent } = e.data;
    const clientY = !originalEvent.touches ? originalEvent.clientY : originalEvent.touches[0].clientY;
    this.mousedown = true;
    if (this.scrollTween) {
      this.scrollTween.kill();
    }
    this.lastPos = {
      y: clientY
    };
  }

  onmouseup() {
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
    this.lastPos = null;
    this.lastDiff = null;
  }

  // This should be called every tick. Use only for scrolling containers with lots of elements for performance.
  hideOffscreenElements() {
    const startIndex = Math.floor(-(this.scrollContainer.y - this.y) / this.itemHeight);
    const endIndex = Math.floor(startIndex + (this.height / this.itemHeight));
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      item.visible = false;
      if (i >= startIndex && i <= endIndex + 1) {
        item.visible = true;
      }
    }
  }

  addItem(...items) {
    for (const item of items) {
      this.scrollContainer.addChild(item);
      this.items.push(item);
      item.y = (this.items.length - 1) * this.itemHeight;
    }
  }

  removeChildren() {
    this.scrollContainer.removeChildren();
    this.items = [];
  }
}
