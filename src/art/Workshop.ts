import Phaser from "phaser";
import { FLOOR, WORLD_H, H, W } from "../config/gameConfig";
import { getLevel } from "../config/levels";
export function workshop(s: Phaser.Scene) {
  const level = getLevel(s.registry.get("level"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (level.id === "workshop") {
    // Mirrored joins match perfectly without stretching the new vertical artwork.
    const tileHeight = W * 2;
    const factor = reducedMotion ? 0 : 0.22;
    const tiles = Math.ceil((H + (WORLD_H - H) * factor) / tileHeight);
    for (let i = 0; i < tiles; i++)
      s.add.image(W / 2, i * tileHeight, level.background).setOrigin(0.5, 0)
        .setDisplaySize(W, tileHeight).setFlipY(i % 2 === 1).setScrollFactor(factor).setDepth(-30);
    s.add.rectangle(W / 2, H / 2, W, H, 0x081d29, 0.12).setScrollFactor(0).setDepth(-29);
    // Near lights move faster than the wall, giving the ascent a sense of depth.
    for (let y = 80; y < WORLD_H * 0.45 + H; y += 420) {
      for (const x of [22, W - 22]) {
        const light = s.add.image(x, y, "glow").setDisplaySize(72, 220)
          .setTint(y % 840 === 80 ? 0xffce80 : 0x85e8db).setAlpha(0.16)
          .setBlendMode(Phaser.BlendModes.ADD).setScrollFactor(reducedMotion ? 0 : 0.45).setDepth(-24);
        if (!reducedMotion) s.tweens.add({ targets: light, alpha: 0.29,
          duration: 2600 + y % 1000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      }
    }
    if (!reducedMotion) {
      for (let i = 0; i < 16; i++) {
        const mote = s.add.image(24 + (i * 137) % 492, 160 + (i * 89) % 670, "particle")
          .setDisplaySize(2 + i % 3, 2 + i % 3).setTint(i % 3 ? 0xc0f6ed : 0xffd391)
          .setAlpha(0.22).setScrollFactor(0).setDepth(-18);
        s.tweens.add({ targets: mote, y: mote.y - 95, x: mote.x + (i % 2 ? 16 : -16),
          alpha: 0, duration: 5000 + i * 211, delay: i * 150, repeat: -1, yoyo: true, ease: "Sine.InOut" });
      }
    }
  } else {
    s.add.image(270, H / 2, level.background).setDisplaySize(640, 960).setScrollFactor(0).setDepth(-30);
    s.add.rectangle(270, H / 2, W, H, 0x08141e, level.id === "home" ? 0.12 : 0.25).setScrollFactor(0).setDepth(-29);
  }
  for (let i = 0; i < 3; i++)
    s.add.image(103, FLOOR + 45 + i * 36, level.platform).setDisplaySize(270 + i * 8, 65).setDepth(3);
  s.add.text(105, FLOOR + 29, "INÍCIO", { fontFamily: "Arial", fontSize: "18px", letterSpacing: 4, color: "#c7d8df" }).setOrigin(0.5).setDepth(6);
  const sections = level.id === "home" ? ["SALA DE ESTAR", "CANTINHO DO CAFÉ", "LAR, DOCE LAR"]
    : level.id === "studio" ? ["PASSAGEM DE SOM", "ENCONTRE O RITMO", "ÚLTIMO ACORDE"]
    : ["PREPARAÇÃO", "ESTRUTURA", "ACABAMENTO"];
  for (const [index, title] of sections.entries())
    s.add.text(270, FLOOR - 180 - index * 2100, title, { fontFamily: "Arial", fontSize: "17px", letterSpacing: 5, color: "#b3d7d8" }).setOrigin(0.5).setAlpha(0.45).setDepth(-19);
}
