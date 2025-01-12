import { Texture } from '@engine/loaders';

export default class TexturePickEvent {
  constructor(public readonly texture: Texture | undefined) {}
}
