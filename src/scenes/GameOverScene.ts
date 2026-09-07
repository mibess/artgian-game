import Phaser from "phaser";
import { result } from "../ui/Result";
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }
  create(data: { count: number; time: number }) {
    result(this, false, data);
  }
}
