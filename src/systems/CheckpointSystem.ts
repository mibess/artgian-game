import { FLOOR } from "../config/gameConfig.ts";
export class CheckpointSystem {
  index = 0;
  x = 105;
  y = FLOOR - 56;
  activate(index: number, x: number, y: number) {
    if (index <= this.index) return false;
    this.index = index;
    this.x = x;
    this.y = y - 56;
    return true;
  }
}
