import Phaser from "phaser";
import { result } from "../ui/Result";
export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super("LevelComplete");
  }
  create(data: { count: number; time: number; lives: number }) {
    result(this, true, data);
  }
}
