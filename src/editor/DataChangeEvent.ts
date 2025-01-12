import { SpriteMashData } from '@engine/elements';
import History from './History';

export default class DataChangeEvent {
  constructor(public readonly history: History<SpriteMashData>) {}
}
