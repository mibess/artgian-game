import Phaser from "phaser";
import { FLOOR, WORLD_H, H } from "../config/gameConfig";
export function workshop(s: Phaser.Scene) {
  // A distant photographic plane, moving 10% as fast as the playable level.
  s.add
    .image(270, 415 + (WORLD_H - H) * 0.1, "workshop-depth")
    .setDisplaySize(833, 1480)
    .setScrollFactor(0.1)
    .setDepth(-30);
  const atmosphere = s.add.graphics().setScrollFactor(0).setDepth(-29);
  atmosphere.fillGradientStyle(
    0x172553,
    0x7a4918,
    0x122446,
    0x523620,
    0.08,
    0.06,
    0.08,
    0.05,
  );
  atmosphere.fillRect(0, 0, 540, H);
  // Tall physical rails: front faces and warm hardware, behind the gameplay plane.
  for (let y = -320; y < WORLD_H + 330; y += 300) {
    s.add.image(179, y, "rail").setDisplaySize(72, 329).setDepth(-13);
    s.add
      .image(501, y + 80, "rail")
      .setDisplaySize(63, 331)
      .setDepth(-13);
  }
  const cables = s.add.graphics().setDepth(-14);
  cables.lineStyle(9, 0x0b1220, 0.95);
  for (const x of [153, 517]) {
    cables.beginPath();
    cables.moveTo(x, -200);
    for (let y = -100; y < WORLD_H + 200; y += 170)
      cables.lineTo(x + Math.sin(y * 0.007) * 12, y);
    cables.strokePath();
  }
  cables.lineStyle(2, 0x886135, 0.6);
  cables.lineBetween(153, 0, 153, WORLD_H);
  // Independent shelf plane; props remain dimensional as the camera climbs.
  for (const y of [FLOOR - 305, FLOOR - 1250, FLOOR - 2340, FLOOR - 3130]) {
    s.add.image(39, y, "shelf").setDisplaySize(185, 188).setDepth(-4);
    s.add
      .image(548, y - 280, "shelf")
      .setDisplaySize(149, 160)
      .setFlipX(true)
      .setDepth(15)
      .setScrollFactor(0.96);
  }
  const plaque = (
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    color: number = 0x292533,
    ink = "#c5b3c4",
    angle = -4,
    size = 18,
  ) => {
    const g = s.add.graphics();
    g.fillStyle(0x090e1c, 0.5).fillRect(-w / 2 + 7, -h / 2 + 8, w, h);
    g.fillStyle(color, 0.96).fillRect(-w / 2, -h / 2, w, h);
    g.lineStyle(2, 0x83706a, 0.7).strokeRect(-w / 2, -h / 2, w, h);
    g.fillStyle(0xa69b92);
    for (const a of [-1, 1])
      for (const b of [-1, 1])
        g.fillCircle(a * (w / 2 - 6), b * (h / 2 - 6), 2);
    const t = s.add
      .text(0, 0, text, {
        fontFamily: "Trebuchet MS",
        fontStyle: "bold italic",
        fontSize: size + "px",
        lineSpacing: 8,
        align: "center",
        color: ink,
      })
      .setOrigin(0.5);
    return s.add.container(x, y, [g, t]).setAngle(angle).setDepth(-3);
  };
  plaque(
    47,
    FLOOR - 675,
    104,
    186,
    "PEQUENAS\nCAMADAS\nGRANDES\nCOISAS",
    0x272536,
    "#c2b1c7",
    -5,
    18,
  );
  plaque(
    93,
    FLOOR - 530,
    67,
    101,
    "IDEIAS\n↓\nMODELOS\n↓\nREALIDADE",
    0xd4a942,
    "#242731",
    -6,
    11,
  );
  plaque(
    178,
    FLOOR - 427,
    59,
    195,
    "CAMADA\nPOR\nCAMADA\n\n↑\n↑",
    0x262435,
    "#bfaec6",
    0,
    13,
  );
  plaque(
    510,
    FLOOR - 475,
    136,
    210,
    "IMPRIMA\nPULE\nCOLETE\nALCANCE\nCONQUISTE",
    0x392a37,
    "#bca8be",
    -6,
    18,
  );
  plaque(
    508,
    FLOOR - 275,
    131,
    171,
    "\n\nCOISAS\nBOAS LEVAM\nCAMADAS\n☺",
    0x234570,
    "#bcb2d2",
    -5,
    15,
  );
  s.add
    .image(503, FLOOR - 327, "hat")
    .setDisplaySize(95, 56)
    .setTint(0x829bc7)
    .setAlpha(0.65)
    .setAngle(-5)
    .setDepth(-2);
  for (const y of [FLOOR - 1610, FLOOR - 2660]) {
    plaque(
      45,
      y,
      111,
      168,
      "PEQUENAS\nCAMADAS.\nGRANDES\nCOISAS.",
      0x2c2a39,
      "#bcaec4",
      -5,
      16,
    );
    plaque(
      513,
      y - 260,
      130,
      205,
      "IMPRIMA\nPULE\nCOLETE\nALCANCE\nCONQUISTE",
      0x332b3b,
      "#c5b2c7",
      -5,
      17,
    );
  }
  // The summit keeps the same framed composition as the opening view.
  plaque(
    47,
    188,
    108,
    184,
    "PEQUENAS\nCAMADAS\nGRANDES\nCOISAS",
    0x272536,
    "#c2b1c7",
    -5,
    18,
  );
  plaque(
    83,
    370,
    72,
    105,
    "IDEIAS\n↓\nMODELOS\n↓\nREALIDADE",
    0xd4a942,
    "#242731",
    -6,
    11,
  );
  plaque(
    179,
    601,
    58,
    191,
    "CAMADA\nPOR\nCAMADA\n\n↑\n↑",
    0x262435,
    "#bfaec6",
    0,
    13,
  );
  plaque(
    518,
    428,
    140,
    226,
    "IMPRIMA\nPULE\nCOLETE\nALCANCE\nCONQUISTE",
    0x392a37,
    "#bca8be",
    -6,
    18,
  );
  plaque(
    510,
    679,
    133,
    193,
    "\n\nCOISAS\nBOAS LEVAM\nCAMADAS\n☺",
    0x234570,
    "#bcb2d2",
    -5,
    15,
  );
  s.add
    .image(505, 616, "hat")
    .setDisplaySize(94, 56)
    .setTint(0x829bc7)
    .setAlpha(0.65)
    .setAngle(-5)
    .setDepth(-2);
  s.add.image(455, 816, "fan").setDisplaySize(105, 105).setDepth(-3);
  // Heavy starting pedestal and a side fan mirror the reference's visual weight.
  for (let i = 0; i < 3; i++)
    s.add
      .image(103, FLOOR + 45 + i * 36, "platform")
      .setDisplaySize(270 + i * 8, 65)
      .setTint(0x9a9ba2)
      .setDepth(3);
  plaque(
    93,
    FLOOR + 36,
    175,
    38,
    "INÍCIO  ›››",
    0x202835,
    "#dddaea",
    0,
    23,
  ).setDepth(6);
  s.add
    .image(439, FLOOR - 145, "fan")
    .setDisplaySize(120, 113)
    .setDepth(4);
  s.add
    .image(370, FLOOR - 340, "boost")
    .setDisplaySize(60, 231)
    .setDepth(-2);

  for (const y of [FLOOR - 1440, FLOOR - 2790])
    s.add.image(470, y, "fan").setDisplaySize(104, 104).setDepth(-3);
  const foreground = s.add.graphics().setScrollFactor(0).setDepth(16);
  foreground.fillGradientStyle(
    0x0a111d,
    0x0a111d,
    0x070e16,
    0x070e16,
    0,
    0,
    0.26,
    0.26,
  );
  foreground.fillRect(0, 720, 540, 240);
  for (let i = 0; i < 15; i++) {
    const x = (i * 137) % 540,
      y = (i * 229) % 960;
    const p = s.add
      .image(x, y, "glow")
      .setTint(i % 2 ? 0xffc664 : 0x59cfff)
      .setScale(0.025)
      .setAlpha(0.5)
      .setScrollFactor(0.2)
      .setDepth(-3);
    s.tweens.add({
      targets: p,
      y: y - 35,
      alpha: 0.05,
      duration: 4000 + i * 110,
      yoyo: true,
      repeat: -1,
    });
  }
}
