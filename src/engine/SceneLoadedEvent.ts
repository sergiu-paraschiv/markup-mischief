import { Scene } from './core';
import Event from './core/Event';

export default class SceneLoadedEvent extends Event {
  constructor(public readonly scene: Scene) {
    super();
  }
}
