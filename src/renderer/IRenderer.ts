import { Element } from '@engine/core';

export default interface IRenderer {
    setRootElement(element: Element): void;
    start(fps: number): void;
}
