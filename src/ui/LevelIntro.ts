import Phaser from "phaser";
import { levels, type Level } from "../config/levels";
import { STAR_GOALS, hasStar, loadRecords } from "../systems/Records";

/** Title card shown while the run connects; it states the goals before play. */
export function levelIntro(s: Phaser.Scene, level: Level, reducedMotion: boolean) {
  const record = loadRecords()[level.id];
  const root = s.add.container(0, 0).setScrollFactor(0).setDepth(120);
  const shade = s.add.rectangle(270, 480, 540, 960, 0x041b25, 0.55);
  const band = s.add.graphics()
    .fillGradientStyle(0x062b33, 0x062b33, 0x041b25, 0x041b25, 0.97, 0.97, 0.97, 0.97)
    .fillRect(0, 300, 540, 330)
    .lineStyle(2, level.accent, 0.8).lineBetween(0, 300, 540, 300).lineBetween(0, 630, 540, 630);
  const text = (y: number, value: string, size: number, color: string, bold = true) =>
    s.add.text(270, y, value, { fontFamily: "Trebuchet MS, Arial", fontSize: `${size}px`, color, align: "center",
      fontStyle: bold ? "bold" : "normal" }).setOrigin(0.5);
  const scale = Math.min(150 / level.productWidth, 92 / level.productHeight);
  const glow = s.add.image(270, 392, "glow").setDisplaySize(260, 160).setTint(level.accent)
    .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35);
  const product = s.add.image(270, 392, level.product)
    .setDisplaySize(level.productWidth * scale, level.productHeight * scale);
  const header = text(326, `FASE ${levels.indexOf(level) + 1} DE ${levels.length}`, 14, "#9fe5d7");
  const title = text(474, level.name.toUpperCase(), 46, "#ffe1a1").setShadow(0, 4, "#06141d", 8, true, true);
  const subtitle = text(514, level.subtitle, 17, "#b3d6d4", false);
  const goals = STAR_GOALS.map((goal, i) => {
    const x = 150 + i * 120, earned = hasStar(record, i);
    return [
      s.add.image(x, 562, earned ? "star" : "star-empty").setDisplaySize(26, 26),
      s.add.text(x, 592, goal.toUpperCase(), { fontFamily: "Trebuchet MS, Arial", fontSize: "12px",
        fontStyle: "bold", color: earned ? "#ffe1a1" : "#8fb3b8" }).setOrigin(0.5),
    ];
  }).flat();
  const status = text(668, "CONECTANDO…", 15, "#d7edf0");
  root.add([shade, band, glow, product, header, title, subtitle, ...goals, status]);
  if (!reducedMotion) {
    band.setAlpha(0);
    s.tweens.add({ targets: band, alpha: 1, duration: 250 });
    for (const [i, item] of [header, product, title, subtitle].entries()) {
      item.setAlpha(0).setX(item.x + 60);
      s.tweens.add({ targets: item, alpha: 1, x: 270, delay: 80 + i * 70, duration: 380, ease: "Cubic.Out" });
    }
    s.tweens.add({ targets: product, y: 384, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    s.tweens.add({ targets: status, alpha: 0.45, duration: 600, yoyo: true, repeat: -1 });
  }
  return {
    setStatus: (value: string) => status.setText(value),
    close: () => {
      if (reducedMotion) { root.destroy(); return; }
      s.tweens.killTweensOf([status, product]);
      s.tweens.add({ targets: root, alpha: 0, duration: 260, onComplete: () => root.destroy() });
    },
  };
}
