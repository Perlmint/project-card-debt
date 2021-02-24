import * as PIXI from 'pixi.js';
import frame from 'game-asset!./res/result/frame.png';
import empty_button from 'game-asset!./res/empty_button.png';
import scene_texture from 'game-asset-glob!./res/result/scene/*.png';
import strings from "./res/ko.json";

export class ResultView extends PIXI.NineSlicePlane {
    constructor(result: "win" | "defeat", role: "found" | "lost") {
        super(PIXI.Texture.from(frame), 25, 20, 26,  26);

        this.width = 600;
        this.height = 458;
        this.interactive = true;

        const title = new PIXI.Text(strings[result], {
            fontWeight: 700,
            fontSize: 40,
        });
        title.anchor.set(0.5, 0);
        title.position.set(this.width / 2, 30);
        this.addChild(title);

        const scene = `${role}_${result}` as const;
        const desc = new PIXI.Text(strings[`result.${scene}` as const], {
            fontWeight: 400,
            fontSize: 14,
        });
        desc.anchor.set(0.5, 0.5);
        desc.position.set(this.width / 2, 108);
        this.addChild(desc);

        const inner_scene = PIXI.Sprite.from(scene_texture[scene]);
        inner_scene.position.set(110, 141);
        this.addChild(inner_scene);

        const button = PIXI.Sprite.from(empty_button);
        button.position.set(195, 365);
        this.addChild(button);

        const button_label = new PIXI.Text("게임 끝내기", {
            fontWeight: 400,
            fontSize: 14,
        });
        button_label.anchor.set(0.5, 0.5);
        button_label.position.set(button.width / 2, button.height / 2);
        button.addChild(button_label);
        button.interactive = true;
        button.buttonMode = true;
        button.on('pointertap', () => {
            location.href = '/';
        });
    }
}