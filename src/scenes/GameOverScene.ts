import Phaser from "phaser";
import { result } from "../ui/Result";
import type { ResultData } from "../ui/Victory";
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }
  create(data: ResultData & { progress?: number }) {
    result(this, false, data);
  }
}
