import { animateGardenSprite } from "../art/Garden";
import Phaser from "phaser";
import { restoreCompletion } from "../systems/GameSession";
import { getLevel, levels } from "../config/levels";
import { characters, getCharacter, characterFrameCount } from "../config/characters";
import { mountInstallPrompt } from "../ui/InstallPrompt";
import { formatTime, hasStar, loadHeroClears, loadRecords, totalStars } from "../systems/Records";

export class MenuScene extends Phaser.Scene {
  private portraits: Phaser.GameObjects.Image[] = [];
  private reducedMotion = false;
  private starting = false;
  constructor() { super("Menu"); }
  create() {
    this.portraits = [];
    this.starting = false;
    const removeInstallPrompt = mountInstallPrompt();
    this.events.once("shutdown", removeInstallPrompt);
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.cameras.main.resetFX();
    this.input.enabled = true;
    const duration = this.reducedMotion ? 0 : 280;
    const text = (x: number, y: number, value: string, size: number, color = "#f2fbf8", bold = false) =>
      this.add.text(x, y, value, { fontFamily: "Arial", fontSize: size + "px", color,
        fontStyle: bold ? "bold" : "normal" }).setOrigin(0.5);
    this.add.image(270, 480, "jump-title").setDisplaySize(540, 960);
    if (!this.reducedMotion) {
      // Ambient loop generated from the title art (same framing). It streams
      // after the menu appears and fades in over the still image once playing.
      const ambient = this.add.video(270, 480).setAlpha(0);
      ambient.once(Phaser.GameObjects.Events.VIDEO_TEXTURE, () => {
        const element = ambient.video!;
        ambient.setScale(540 / (element.videoWidth || 720), 960 / (element.videoHeight || 1280));
        this.tweens.add({ targets: ambient, alpha: 1, duration: 600 });
      });
      ambient.loadURL("assets/menu/menu-loop.mp4", true).setMute(true).play(true);
    }
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x062b33, 0x062b33, 0x041b25, 0x041b25, 0, 0, 1, 1)
      .fillRect(0, 440, 540, 140);
    shade.fillStyle(0x041b25).fillRect(0, 580, 540, 380);
    if (!this.reducedMotion) {
      for (let i = 0; i < 12; i++) {
        const mote = this.add.circle(35 + (i * 97) % 470, 80 + (i * 43) % 360, i % 3 + 1,
          i % 2 ? 0xffce76 : 0x87f0e1, 0.35);
        this.tweens.add({ targets: mote, y: mote.y - 38, alpha: 0, duration: 2100 + i * 170,
          delay: i * 140, repeat: -1, yoyo: true, ease: "Sine.InOut" });
      }
    }
    const chooseLabel = text(270, 506, "ESCOLHA QUEM VAI SALTAR", 14, "#d9fff4", true)
      .setShadow(0, 2, "#031a23", 5, true, true);
    const selected = getCharacter(this.registry.get("character"));
    const heroClears = loadHeroClears();
    const colors = [0x71e6df, 0xcbb2ff, 0xffb9d8, 0xffc98b];
    const characterSpacing = 486 / characters.length;
    const portraitScale = Math.min(1, 3 / characters.length);
    const cards = characters.map((character, index) => {
      const x = 270 + (index - (characters.length - 1) / 2) * characterSpacing;
      const root = this.add.container(x, 439);
      const halo = this.add.image(0, -62, "glow").setDisplaySize(170 * portraitScale, 230)
        .setTint(colors[index]).setBlendMode(Phaser.BlendModes.ADD);
      const ring = this.add.ellipse(0, 0, 110 * portraitScale, 18, colors[index], 0.16).setStrokeStyle(2, colors[index], 0.4);
      const portrait = this.add.image(0, 0, character.id + "-idle", 0)
        .setOrigin(character.originX, character.originY).setDisplaySize(190, 190);
      const fx = portrait.preFX?.addColorMatrix();
      this.portraits.push(portrait);
      const pill = this.add.graphics();
      const label = text(0, 36, character.name, 20, "#fff6df", true);
      // Levels this character has cleared: a counter, then a medal at 4/4.
      const cleared = heroClears[character.id]?.length ?? 0;
      const medal = cleared ? [
        this.add.circle(58 * portraitScale, 22, 11, cleared >= levels.length ? 0xffc94d : 0x81f1ce)
          .setStrokeStyle(2, 0x062b33),
        text(58 * portraitScale, 22, cleared >= levels.length ? "★" : String(cleared), 12, "#0b2a32", true),
      ] : [];
      root.add([halo, ring, portrait, pill, label, ...medal]);
      const zone = this.add.zone(x, 394, characterSpacing - 14, 220).setInteractive({ useHandCursor: true });
      return { character, root, portrait, fx, halo, ring, pill, label, zone };
    });
    const selectCharacter = (id: string, animate = true) => {
      if (this.starting) return;
      this.registry.set("character", id);
      const cleared = heroClears[id]?.length ?? 0;
      chooseLabel.setText(!cleared ? "ESCOLHA QUEM VAI SALTAR"
        : cleared >= levels.length ? `🏅 ${getCharacter(id).name.toUpperCase()} ZEROU TODAS AS FASES`
        : `${getCharacter(id).name.toUpperCase()} · ${cleared} DE ${levels.length} FASES CONCLUÍDAS`);
      for (const card of cards) {
        const active = card.character.id === id;
        card.pill.clear().fillStyle(active ? 0xffce79 : 0x0b3540, 0.96)
          .fillRoundedRect(-65 * portraitScale, 20, 130 * portraitScale, 34, 17);
        card.label.setText((active ? "✓ " : "") + card.character.name).setColor(active ? "#172d30" : "#869fa5");
        this.tweens.killTweensOf(card.portrait);
        this.tweens.add({ targets: card.portrait, scaleX: (active ? 212 : 185) * portraitScale / 256,
          scaleY: (active ? 212 : 185) * portraitScale / 256, alpha: active ? 1 : 0.72,
          duration: animate ? duration : 0, ease: "Back.Out" });
        card.halo.setAlpha(active ? 0.3 : 0);
        card.ring.setAlpha(active ? 1 : 0.2);
        card.portrait.setY(0);
        if (card.fx) {
          card.fx.reset();
          if (!active) {
            card.fx.grayscale(1);
          }
        }
        if (active) {
          card.portrait.clearTint();
        } else {
          card.portrait.setTint(0x94a2a8);
        }
        if (active && animate && !this.reducedMotion)
          this.tweens.add({ targets: card.portrait, y: -16, duration: 180, yoyo: true, ease: "Sine.Out" });
      }
    };
    cards.forEach(card => card.zone.on("pointerdown", () => selectCharacter(card.character.id)));
    selectCharacter(selected.id, false);
    text(35, 538, "ESCOLHA SEU MUNDO", 15, "#a8d9d9", true).setOrigin(0, 0.5);
    const records = loadRecords();
    const starsEarned = totalStars(records), starsTotal = levels.length * 3;
    const starLabel = text(504, 538, `★ ${starsEarned} / ${starsTotal}`, 15, "#ffd27a", true).setOrigin(1, 0.5);
    if (this.textures.exists("trophy")) {
      // Long-term goal: the trophy lights up once every star is earned.
      const master = starsEarned >= starsTotal;
      const trophy = this.add.image(starLabel.x - starLabel.width - 20, 536, "trophy");
      trophy.setScale(30 / trophy.height).setInteractive({ useHandCursor: true });
      if (!master) trophy.setTint(0x55707a).setAlpha(0.8);
      else if (!this.reducedMotion) this.tweens.add({ targets: trophy, angle: { from: -6, to: 6 },
        duration: 900, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      trophy.on("pointerdown", () => hint.setText(master
        ? "🏆 Mestre impressor! Você conquistou todas as estrelas."
        : `🏆 Troféu de mestre impressor: conquiste as ${starsTotal} estrelas (faltam ${starsTotal - starsEarned}).`));
    }
    // Cards shrink to fit every level inside the 492 px row (5 levels: 92 px).
    const stageGap = levels.length > 4 ? 8 : 12;
    const stageWidth = Math.min(112, Math.floor((492 - stageGap * (levels.length - 1)) / levels.length));
    const edge = stageWidth / 2;
    const stageCards = levels.map((level, index) => {
      const x = 270 + (index - (levels.length - 1) / 2) * (stageWidth + stageGap), root = this.add.container(x, 651);
      const border = this.add.graphics();
      const preview = this.add.image(0, -18, level.background).setDisplaySize(stageWidth - 10, 96);
      const previewFx = preview.preFX?.addColorMatrix();
      const tint = this.add.rectangle(0, -18, stageWidth - 10, 96, 0x061e29, 0.23);
      const scale = Math.min((stageWidth - 26) / level.productWidth, 65 / level.productHeight);
      const product = this.add.sprite(0, -16, level.product).setDisplaySize(level.productWidth * scale, level.productHeight * scale);
      if (level.id === "garden") animateGardenSprite(product, "bowl");
      const productFx = product.preFX?.addColorMatrix();
      const label = text(0, 47, level.name, 17, "#f3f9f6", true);
      const stars = [0, 1, 2].map(i => this.add.image((i - 1) * 20, 69, hasStar(records[level.id], i) ? "star" : "star-empty")
        .setDisplaySize(18, 18));
      const badge = text(edge - 18, -65, "✓", 17, "#132d35", true);
      const badgeBg = this.add.circle(edge - 18, -65, 12, 0xffce79);
      const fresh = records[level.id] ? [] : [
        this.add.graphics().fillStyle(0x81f1ce).fillRoundedRect(-edge + 5, -77, 42, 19, 9.5),
        text(-edge + 26, -67.5, "NOVO", 10, "#0b2a32", true),
      ];
      root.add([border, preview, tint, product, label, ...stars, badgeBg, badge, ...fresh]);
      const zone = this.add.zone(x, 651, stageWidth, 166).setInteractive({ useHandCursor: true });
      return { level, root, border, preview, previewFx, tint, product, productFx, label, badge, badgeBg, zone };
    });
    const productLabel = text(270, 754, "", 16, "#ffdc9e", true);
    const hint = text(270, 787, "", 14, "#a6c7ce").setWordWrapWidth(456).setAlign("center");
    const selectLevel = (id: string, animate = true) => {
      if (this.starting) return;
      const level = getLevel(id);
      this.registry.set("level", level.id);
      productLabel.setText("NA IMPRESSORA  ·  " + level.productName.toUpperCase());
      const record = records[level.id];
      hint.setText(record?.bestTime ? `Recorde: ${formatTime(record.bestTime)}  ·  ${level.hint}`
        : record?.bestProgress ? `Melhor altura: ${Math.floor(record.bestProgress * 100)}%  ·  ${level.hint}`
        : level.hint);
      if (animate && !this.reducedMotion) {
        this.tweens.killTweensOf([productLabel, hint]);
        productLabel.setAlpha(0); hint.setAlpha(0);
        this.tweens.add({ targets: [productLabel, hint], alpha: 1, duration });
      }
      for (const card of stageCards) {
        const active = card.level.id === level.id;
        card.border.clear().fillStyle(active ? 0x16454c : 0x091b22)
          .fillRoundedRect(-stageWidth / 2, -83, stageWidth, 166, 16)
          .lineStyle(active ? 3 : 1, active ? 0xffce79 : 0x223c44)
          .strokeRoundedRect(-stageWidth / 2, -83, stageWidth, 166, 16);
        card.badge.setVisible(active); card.badgeBg.setVisible(active);
        card.label.setColor(active ? "#f3f9f6" : "#7c979e");
        if (card.previewFx) {
          card.previewFx.reset();
          if (!active) {
            card.previewFx.grayscale(1);
          }
        }
        if (card.productFx) {
          card.productFx.reset();
          if (!active) {
            card.productFx.grayscale(1);
          }
        }
        if (active) {
          card.preview.clearTint();
          card.product.clearTint();
        } else {
          card.preview.setTint(0x8a9aa0);
          card.product.setTint(0x8a9aa0);
        }
        this.tweens.killTweensOf(card.root);
        this.tweens.add({ targets: card.root, y: active ? 643 : 651,
          alpha: active ? 1 : 0.68, duration: animate ? duration : 0, ease: "Cubic.Out" });
      }
    };
    stageCards.forEach(card => card.zone.on("pointerdown", () => selectLevel(card.level.id)));
    selectLevel(getLevel(this.registry.get("level")).id, false);
    const button = this.add.container(270, 859);
    const buttonArt = this.add.graphics().fillStyle(0xa65c25).fillRoundedRect(-234, -31, 468, 70, 22)
      .fillStyle(0xffc568).fillRoundedRect(-234, -38, 468, 70, 22)
      .lineStyle(2, 0xffe0a2).strokeRoundedRect(-232, -36, 464, 66, 21);
    button.add([buttonArt, text(0, -3, "VAMOS SALTAR!  →", 25, "#183136", true)]);
    const start = () => {
      if (this.starting) return;
      this.starting = true;
      this.input.enabled = false;
      if (this.reducedMotion) { this.scene.start("Game"); return; }
      const hero = cards.find(card => card.character.id === this.registry.get("character"))!.portrait;
      this.tweens.killTweensOf(hero);
      this.tweens.add({ targets: hero, y: -100, alpha: 0, duration: 330, ease: "Cubic.In" });
      this.cameras.main.fadeOut(380, 4, 27, 37);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start("Game"));
    };
    this.add.zone(270, 859, 468, 78).setInteractive({ useHandCursor: true })
      .on("pointerdown", start).on("pointerover", () => buttonArt.setAlpha(0.9))
      .on("pointerout", () => buttonArt.setAlpha(1));
    text(270, 919, "← → personagem   ·   ↑ ↓ fase   ·   Enter jogar", 14, "#b3d4db");
    const savedReward = text(270, 942, "VER MEU ÚLTIMO CUPOM", 14, "#ffda90", true)
      .setInteractive({ useHandCursor: true });
    let active = true;
    this.events.once("shutdown", () => { active = false; });
    savedReward.on("pointerdown", async () => {
      if (this.starting) return;
      this.starting = true;
      savedReward.setText("CONSULTANDO CUPOM…");
      try {
        const completion = await restoreCompletion();
        if (!active) return;
        if (completion?.completionId) {
          this.registry.set("level", completion.levelId);
          this.registry.remove("rewardSession");
          this.registry.set("rewardCompletionId", completion.completionId);
          this.scene.start("LevelComplete", completion);
        } else savedReward.setText("CONCLUA UMA FASE PARA GANHAR SEU CUPOM");
      } catch {
        if (active) savedReward.setText("SEM CONEXÃO • TOQUE PARA TENTAR NOVAMENTE");
      } finally { if (active) this.starting = false; }
    });
    const cycleCharacter = (direction: number) => {
      const index = characters.findIndex(c => c.id === this.registry.get("character"));
      selectCharacter(characters[(index + direction + characters.length) % characters.length].id);
    };
    const cycleLevel = (direction: number) => {
      const index = levels.findIndex(l => l.id === this.registry.get("level"));
      selectLevel(levels[(index + direction + levels.length) % levels.length].id);
    };
    const keys: Record<string, () => void> = {
      LEFT: () => cycleCharacter(-1), RIGHT: () => cycleCharacter(1),
      UP: () => cycleLevel(-1), DOWN: () => cycleLevel(1), SPACE: start, ENTER: start,
    };
    for (const [key, handler] of Object.entries(keys)) this.input.keyboard?.on("keydown-" + key, handler);
    this.events.once("shutdown", () => {
      for (const [key, handler] of Object.entries(keys)) this.input.keyboard?.off("keydown-" + key, handler);
    });
    if (!this.reducedMotion) {
      this.cameras.main.fadeIn(500, 4, 27, 37);
      cards.forEach((card, index) => {
        card.root.setY(457).setAlpha(0);
        this.tweens.add({ targets: card.root, y: 439, alpha: 1, duration: 500,
          delay: 100 + index * 90, ease: "Cubic.Out" });
      });
    }
  }
  update(time: number) {
    if (this.reducedMotion) return;
    this.portraits.forEach((portrait, index) => {
      const character = characters[index];
      portrait.setFrame((Math.floor(time / (character.idleFrameMs ?? 90)) + index * 13) % characterFrameCount(character));
    });
  }
}
