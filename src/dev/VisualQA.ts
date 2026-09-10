import Phaser from "phaser";
import type { GameScene } from "../scenes/GameScene";
/** Local-only traversal harness. Uses normal movement/jump inputs and real collisions;
 * never disables hazards, changes lives, teleports, or grants collectibles. P toggles it. */
export class VisualQA {
  running = false;
  target = 1;
  lastJump = -999;
  landings: number[] = [0];
  lastLanded = 0;
  stopAt = 14;
  output: HTMLOutputElement;
  constructor(private scene: GameScene) {
    this.output = document.createElement("output");
    this.output.id = "qa-status";
    this.output.style.cssText = "position:fixed;left:-10000px;top:0";
    document.body.append(this.output);
    scene.input.keyboard!.on("keydown-P", () => {
      this.running = !this.running;
      if (this.lastLanded >= 14) this.stopAt = 26;
    });
    scene.input.keyboard!.on("keydown-K", () =>
      scene.game.renderer.snapshot(
        (image: HTMLImageElement | Phaser.Display.Color) => {
          if (image instanceof HTMLImageElement) {
            let img = document.querySelector<HTMLImageElement>("#qa-capture");
            if (!img) {
              img = document.createElement("img");
              img.id = "qa-capture";
              img.hidden = true;
              document.body.append(img);
            }
            img.src = image.src;
          }
        },
      ),
    );
    scene.events.once("shutdown", () => {
      this.output.remove();
      document.querySelector("#qa-capture")?.remove();
    });
  }
  landed(index: number) {
    this.lastLanded = index;
    if (!this.landings.includes(index)) this.landings.push(index);
    this.target = index + 1;
    if (index === this.stopAt) this.running = false;
  }
  input() {
    const s = this.scene, sim = s.simulation;
    const b = { bottom: sim.feet, height: 65, velocity: { x: sim.vx, y: sim.vy },
      blocked: { down: sim.support >= 0 }, touching: { down: sim.support >= 0 } };
    this.output.textContent = JSON.stringify({
      running: this.running,
      target: this.target,
      landed: this.lastLanded,
      landings: this.landings,
      progress: Math.round(s.maxProgress * 100),
      lives: s.lives,
      collected: s.collected,
      x: Math.round(s.player.x),
      y: Math.round(s.player.y),
      feet: Math.round(b.bottom),
      vy: Math.round(b.velocity.y),
      paused: s.paused,
    });
    if (!this.running) return { axis: 0, jump: false };
    const to = s.ledges[Math.min(this.target, s.ledges.length - 1)];
    if (!to) return { axis: 0, jump: false };
    const grounded = (b.blocked.down || b.touching.down) && b.velocity.y >= 0;
    const overhead = s.hazards.find(
      (h) =>
        (h.kind === "arm" || h.kind === "head") &&
        Math.abs(h.y - (to.y - 50)) < 90,
    );
    const futureX =
      to.x +
      (to.spec.kind === "horizontal" ? to.dx * 25 : 0) -
      (overhead ? to.spec.w * 0.35 : 0);
    const diff = futureX - s.player.x - b.velocity.x * 0.11;
    let axis = Math.abs(diff) < 7 ? 0 : Math.sign(diff);
    let jump = false;
    if (grounded && s.elapsed - this.lastJump > 500) {
      const source = s.ledges[this.lastLanded];
      const closeEnough = Math.abs(futureX - s.player.x) < 112;
      const atEdge =
        source && Math.abs(s.player.x - source.x) > source.spec.w / 2 - 24;
      const laser = s.hazards.find(
        (h) =>
          h.kind === "laser" &&
          Math.abs(h.y - to.y) < 190 &&
          Math.abs(h.x - futureX) < 150,
      );
      const phase = laser ? (s.elapsed + laser.phase) % 3400 : 2000;
      const laserSafe = !laser || (phase > 1750 && phase < 2650);
      const flight=(690+Math.sqrt(Math.max(0,690*690-2*1550*(b.bottom-(to.y-13.5)))))/1550;
      let mechanicalSafe=true;
      for(let t=.04;t<flight;t+=.035){
        const reach=270*Math.max(0,t-.035);
        const px=s.player.x+Phaser.Math.Clamp(futureX-s.player.x,-reach,reach);
        const feet=b.bottom-690*t+775*t*t;
        for(const h of s.hazards){
          if(h.kind!=="head"&&h.kind!=="arm")continue;
          const hx=h.x+Math.sin((s.elapsed+t*1000)/(h.kind==="head"?950:800))*(h.kind==="head"?175:70);
          if(px+22>hx-h.obj.width/2&&px-22<hx+h.obj.width/2&&feet>h.y-h.obj.height/2&&feet-b.height<h.y+h.obj.height/2)mechanicalSafe=false;
        }
      }
      if ((closeEnough || atEdge) && laserSafe && mechanicalSafe) {
        jump = true;
        this.lastJump = s.elapsed;
      } else if (!laserSafe || !mechanicalSafe) axis = 0;
    }
    return { axis, jump };
  }
}
