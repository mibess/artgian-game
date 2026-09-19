export interface Atmosphere {
  /** Preserved artwork for selection/result screens; gameplay uses environment.ts. */
  backgroundPath: string;
  shade: number;
  shadeAlpha: number;
  lights: readonly [number, number];
  lightSize: readonly [number, number];
  lightAlpha: readonly [number, number];
  lightDuration: number;
  rhythmic?: boolean;
  motes: readonly [number, number];
  moteCount: number;
  moteDuration: number;
  moteRise: number;
  land: number;
  jump: number;
}

export const atmospheres: Record<string, Atmosphere> = {
  garden: {
    backgroundPath: "", // Composed at boot from the separate green-screen assets.
    shade: 0x402b48, shadeAlpha: 0.08,
    lights: [0xffd598, 0xffb2a4], lightSize: [95, 230],
    lightAlpha: [0.06, 0.12], lightDuration: 5000,
    motes: [0xffecc4, 0xffce9e], moteCount: 12, moteDuration: 7000, moteRise: 45,
    land: 0xf4ca99, jump: 0xffe1ad,
  },
  workshop: {
    backgroundPath: "assets/levels/workshop/background.png",
    shade: 0x081d29, shadeAlpha: 0.12,
    lights: [0xffce80, 0x85e8db], lightSize: [72, 220],
    lightAlpha: [0.16, 0.29], lightDuration: 2600,
    motes: [0xc0f6ed, 0xffd391], moteCount: 16, moteDuration: 5000, moteRise: 95,
    land: 0xb2ebdc, jump: 0xe8c992,
  },
  home: {
    backgroundPath: "assets/levels/home/background-parallax.png",
    shade: 0x122c29, shadeAlpha: 0.1,
    lights: [0xffd994, 0xd9edbe], lightSize: [115, 265],
    lightAlpha: [0.12, 0.22], lightDuration: 4200,
    motes: [0xffedc2, 0xd6eec3], moteCount: 14, moteDuration: 6500, moteRise: 65,
    land: 0xe6eac8, jump: 0xffd597,
  },
  studio: {
    backgroundPath: "assets/levels/studio/background-parallax.png",
    shade: 0x14172c, shadeAlpha: 0.12,
    lights: [0xc29aff, 0x87ddef], lightSize: [88, 235],
    lightAlpha: [0.13, 0.26], lightDuration: 1800, rhythmic: true,
    motes: [0xd5c2ff, 0xa6e8f3], moteCount: 16, moteDuration: 4800, moteRise: 85,
    land: 0xc4b0f5, jump: 0x9bdff0,
  },
};

export function getAtmosphere(id: string): Atmosphere {
  return atmospheres[id] ?? atmospheres.workshop;
}
