interface TextureManagerLike {
  getTextureKeys: () => string[];
  get: (key: string) => unknown;
}

/**
 * Re-upload canvas-backed artwork after a mobile browser has suspended or
 * recomposited the WebGL canvas. Static image textures do not expose refresh.
 */
export function refreshCanvasTextures(textures: TextureManagerLike) {
  for (const key of textures.getTextureKeys()) {
    const texture = textures.get(key) as { refresh?: () => unknown };
    if (typeof texture.refresh === "function") texture.refresh();
  }
}
