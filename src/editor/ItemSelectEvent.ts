import { Node2D } from '@engine/elements';

export default class ItemSelectEvent {
  constructor(public readonly item: Node2D | undefined) {}
}
