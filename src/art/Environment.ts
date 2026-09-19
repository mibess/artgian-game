import { gardenEnvironment } from "./Garden";
import Phaser from "phaser";
import { H, W } from "../config/gameConfig";
import { environments, ENVIRONMENT_SCROLL, ZONE_HEIGHT, ZONE_OVERLAP, zoneY, sceneryY,
  type EnvironmentZone } from "../config/environment";

const zones: EnvironmentZone[] = ["upper", "middle", "ground"];
export const environmentKey = (id: string, zone: EnvironmentZone) => `environment-${id}-${zone}`;

/** Prepare feathered strips once, keeping the original images untouched.
 * Runtime alpha compositing also works in Phaser's Canvas renderer. */
export function prepareEnvironments(scene: Phaser.Scene) {
  for (const id of Object.keys(environments)) for (const zone of zones) {
    const key = environmentKey(id, zone);
    const source = scene.textures.get(key).getSourceImage() as HTMLImageElement;
    const texture = scene.textures.createCanvas(key + "-strip", 640, ZONE_HEIGHT)!;
    const context = texture.context;
    const scale = Math.max(640 / source.width, ZONE_HEIGHT / source.height);
    context.drawImage(source, (640 - source.width * scale) / 2,
      (ZONE_HEIGHT - source.height * scale) / 2, source.width * scale, source.height * scale);
    if (zone !== "upper") {
      context.globalCompositeOperation = "destination-in";
      const gradient = context.createLinearGradient(0, 0, 0, ZONE_OVERLAP);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(1, "rgba(255,255,255,1)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 640, ZONE_HEIGHT);
      context.globalCompositeOperation = "source-over";
    }
    texture.refresh();
    scene.textures.remove(key);
  }
}

export function environment(scene: Phaser.Scene, id: string, reducedMotion: boolean) {
  if (id === "garden") { gardenEnvironment(scene, reducedMotion); return; }
  // Three distinct upright spaces, assembled from roof to floor. No repetition.
  for (const [index, zone] of zones.entries())
    scene.add.image(W / 2, zoneY[zone], environmentKey(id, zone) + "-strip")
      .setOrigin(0.5, 0).setScrollFactor(ENVIRONMENT_SCROLL).setDepth(-40 + index);

  const props = environments[id].props;
  // Independently moving near objects remain on the margins, away from the route.
  for (let i = 0; i < 3; i++) {
    for (const side of [0, 1]) {
      const factor = reducedMotion ? ENVIRONMENT_SCROLL : side ? 0.72 : 0.48;
      const y = sceneryY(0.08 + i * 0.4, side ? 590 : 340, factor);
      const x = side ? W + 14 : -14;
      const prop = scene.add.image(x, y, props[i]).setOrigin(0.5)
        .setScrollFactor(factor).setDepth(side ? -16 : -22)
        .setTint(id === "home" ? 0x748477 : id === "studio" ? 0x6c6b92 : 0x617a84)
        .setAlpha(side ? 0.4 : 0.3);
      prop.setScale(Math.min(130 / prop.width, 220 / prop.height));
      if (!reducedMotion) {
        if (id === "workshop" && i === 2)
          scene.tweens.add({ targets: prop, angle: 360, duration: 10000, repeat: -1 });
        else if (i > 0 && id !== "workshop") {
          // Suspended props sway about their top attachment.
          prop.setOrigin(0.5, 0).setAngle(-3);
          scene.tweens.add({ targets: prop, angle: 3, duration: 2800 + i * 600,
            yoyo: true, repeat: -1, ease: "Sine.InOut" });
        }
      }
    }
  }
}
