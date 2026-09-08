import Phaser from "phaser";
import { FLOOR, WORLD_H, H } from "../config/gameConfig";
import { getLevel } from "../config/levels";
export function workshop(s: Phaser.Scene) {
  const level = getLevel(s.registry.get("level"));
  s.add.image(270, H / 2, level.background).setDisplaySize(640, 960).setScrollFactor(0).setDepth(-30);
  s.add.rectangle(270, H / 2, 540, H, 0x08141e, level.id === "home" ? 0.12 : 0.25).setScrollFactor(0).setDepth(-29);
  for (let y = 0; level.id === "workshop" && y < WORLD_H + 330; y += 300) {
    for (const x of [12, 528])
      s.add.image(x, y, "rail").setDisplaySize(26, 330).setAlpha(0.25).setDepth(-20);
  }
  for (let i = 0; i < 3; i++)
    s.add.image(103, FLOOR + 45 + i * 36, level.platform).setDisplaySize(270 + i * 8, 65).setDepth(3);
  s.add.text(105, FLOOR + 29, "INÍCIO", { fontFamily: "Arial", fontSize: "18px", letterSpacing: 4, color: "#c7d8df" }).setOrigin(0.5).setDepth(6);
  const sections = level.id === "home" ? ["SALA DE ESTAR", "CANTINHO DO CAFÉ", "LAR, DOCE LAR"]
    : level.id === "studio" ? ["PASSAGEM DE SOM", "ENCONTRE O RITMO", "ÚLTIMO ACORDE"]
    : ["PREPARAÇÃO", "ESTRUTURA", "ACABAMENTO"];
  for (const [index, title] of sections.entries())
    s.add.text(270, FLOOR - 180 - index * 2100, title, { fontFamily: "Arial", fontSize: "18px", letterSpacing: 5, color: "#69828d" }).setOrigin(0.5).setAlpha(0.45).setDepth(-19);
}
