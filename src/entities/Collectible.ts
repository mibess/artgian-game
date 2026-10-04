import Phaser from "phaser";
export class Collectible extends Phaser.Physics.Arcade.Image {
  private glow: Phaser.GameObjects.Image;
  constructor(s: Phaser.Scene, x: number, y: number) {
    super(s, x, y, "filament");
    // A warm halo keeps the spool readable against bright backgrounds.
    this.glow = s.add.image(x, y, "glow").setTint(0xffc86b).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(84, 84).setAlpha(0.45).setDepth(6);
    s.add.existing(this);
    s.physics.add.existing(this);
    this.setDisplaySize(46, 46).setDepth(7);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    s.tweens.add({
      targets: this,
      y: y - 8,
      angle: 12,
      duration: 1100,
      yoyo: true,
      repeat: -1,
    });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      s.tweens.add({ targets: this.glow, y: y - 8, alpha: 0.2, duration: 1100, yoyo: true, repeat: -1 });
  }
  collect() {
    this.disableBody(true, true);
    this.glow.setVisible(false);
  }
}
