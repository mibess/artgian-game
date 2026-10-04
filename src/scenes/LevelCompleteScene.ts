import Phaser from "phaser";
import { result } from "../ui/Result";
import type { ResultData } from "../ui/Victory";
export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super("LevelComplete");
  }
  create(data: ResultData) {
    result(this, true, data);
  }
}
