import { Animation } from '@engine/elements';

export default class AnimationPickEvent {
  constructor(public readonly animation: Animation | undefined) {}
}
