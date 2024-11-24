import { Scene } from '@engine/core';

export default interface IRenderer {
    loadScene(scene: Scene): void;
    start(fps: number): void;
}
