import Phaser from "phaser";
export class Collectible extends Phaser.Physics.Arcade.Image {
  constructor(s: Phaser.Scene, x: number, y: number) {
    super(s, x, y, "spool");
    s.add.existing(this);
    s.physics.add.existing(this);
    this.setDisplaySize(39, 44).setDepth(7);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    s.tweens.add({
      targets: this,
      y: y - 8,
      angle: 12,
      duration: 1100,
      yoyo: true,
      repeat: -1,
    });
  }
}
