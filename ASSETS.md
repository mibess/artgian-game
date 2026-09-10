# Fundo da Oficina — setembro de 2026

Arquivo: `public/assets/levels/workshop/background.png` (887 × 1774 px).
Gerado com a ferramenta nativa ImageGen. Sem recortar ou alterar a imagem gerada.
A imagem é repetida com espelhamento vertical alternado para unir bordas idênticas,
com parallax de 0,22; luzes dianteiras usam 0,45. Abaixo estão as novas artes
das outras duas fases.

Prompt utilizado:

> Use case: stylized-concept. Asset type: scrolling parallax background bitmap for the first level, Oficina, in the vertical platform game Artgian Jump. Generate exactly one image, 1024x2048 pixels, tall 1:2 portrait format. Primary request: polished stylized 3D illustration of a tall quiet 3D-print workshop service shaft. Straight-on orthographic view. Composition/framing: the central 75% of the entire image width is minimal softly shaded wall, free of objects, with very subdued shallow panel seams only, giving clear readable negative space for separately rendered player and platforms. Place narrow rails and sparse small filament storage details exclusively at the extreme left and right edges. Long repetitive vertical architecture suitable for upward scrolling. Homogeneous matching top and bottom colors. No visible floor or ceiling. Lighting/mood: quiet soft ambient lighting, subdued contrast, visible dimensional surfaces rather than black darkness. Subtle warm amber edge lights. Color palette: deep petrol and teal with desaturated navy walls. Constraints: no text, logos, watermarks, people, characters, platforms, foreground printer, UI, bright busy detail, perspective floor, ceiling, central objects. Full bleed background only.

# Casa e Estúdio — setembro de 2026

Gerados pela ferramenta nativa ImageGen, uma geração por imagem, sem retoques.
Ambos possuem 887 × 1774 px (1:2). As imagens anteriores estão preservadas.

- Casa: `public/assets/levels/home/background-parallax.png`
- Estúdio: `public/assets/levels/studio/background-parallax.png`

São usados no jogo e nas miniaturas existentes de seleção. Mesma repetição
espelhada e parallax da Oficina; parâmetros em `src/config/atmospheres.ts`.

## Prompt da Casa

```text
Use case: stylized-concept
Asset type: vertically scrolling platform-game background, portrait 1:2 aspect ratio, requested 1024x2048.
Primary request: a premium softly rendered 3D welcoming home interior wall, straight-on orthographic, full bleed.
Scene/backdrop: repetitive tall architectural wall intended to scroll with mirrored vertical repeat. Muted deep eucalyptus and blue-green sage-teal wall, slim natural oak moldings only at extreme left and right margins, tiny sparse botanical trailing leaves only along outer edges. Restrained molding joints.
Composition: at least the central 75% of image width must remain entirely clear, empty, low-detail uninterrupted sage-teal wall for a separately rendered platform-game character and platforms. Edge details must stay within the outermost 12% on each side. No perspective room corners, no floor, no ceiling, no baseboard or crown molding.
Style/medium: polished tactile stylized 3D game environment, softly rounded molded details, subtle wall material, premium render.
Lighting: warm honey ambient light, center evenly softly lit; moderate contrast, readable rather than black. Soft highlights confined to margins. No strong top-to-bottom lighting gradient, consistent top and bottom edge colors so a vertically mirrored repeat feels continuous.
Avoid: text, logos, watermark, people, characters, UI, platforms, printers, playable obstacles, shelves, picture frames, lamps, furniture, decorative objects in central area. Do not add clearly oriented objects or shadows that reveal vertically mirrored repetition. Generate exactly one image.
```

## Prompt do Estúdio

```text
Use case: stylized-concept
Asset type: vertically scrolling platform-game background, portrait 1:2 aspect ratio, requested 1024x2048.
Primary request: premium softly rendered 3D music recording studio interior acoustic wall, straight-on orthographic, full bleed.
Scene/backdrop: repetitive tall architectural acoustic wall intended to scroll with mirrored vertical repeat. Rich midnight indigo and deep blue-indigo with muted violet and cyan ambient light. Slim dark acoustic wall strips and sparse metallic trim only at the extreme left and right edges. Minimal continuous vertical LED accents at margins.
Composition: at least the central 75% of image width must remain entirely clear, empty, low-detail uninterrupted deep blue-indigo acoustic wall for a separately rendered platform-game character and platforms. Edge details must stay within the outermost 12% on each side. No perspective room corners, no floor, no ceiling, no horizontal ledges, no baseboard or crown molding.
Style/medium: polished tactile stylized 3D game environment, softly rounded acoustic materials, premium render, subtle fabric texture, restrained details.
Lighting: muted violet and cyan ambient edge light, quiet evenly softly lit central wall; moderate contrast, legible rather than black. Soft highlights confined to margins. No strong top-to-bottom lighting gradient, consistent top and bottom edge colors so a vertically mirrored repeat feels continuous.
Avoid: text, logos, watermark, people, characters, UI, platforms, printers, playable obstacles, microphones, speakers, instruments, lamps, equalizer graphics, shelves, picture frames, furniture, objects in central area. Do not add clearly oriented objects or shadows that reveal vertically mirrored repetition. Generate exactly one image.
```

# Ambientes por altura — chão, área intermediária e teto

Seis novas imagens geradas com a ferramenta nativa ImageGen (uma geração por imagem),
1024 × 1536 px cada. Imagens anteriores preservadas. No jogo, o chão usa as imagens
originais `assets/workshop-clean.png`, `assets/levels/home/background.png` e
`assets/levels/studio/background.png`. As duas imagens novas de cada fase formam
um ambiente contínuo com sobreposição suave; não há repetição ou espelhamento.

## oficina-mid

Arquivo: `public/assets/levels/workshop/environment-middle.png`

Prompt:

```text
Use case: stylized-concept. Asset type: vertical climbing game environment background, single distinct height zone. Generate ONE image, portrait 2:3, requested 1024x1536. Premium polished stylized 3D render, full bleed, straight-on front elevation facing a wall, orthographic-like. Keep the central 65-70 percent of image width an open softly textured wall with negative space for separately rendered player and platforms. Place sparse large recognizable environmental details only at extreme side margins. No characters, people, text, UI, logos, watermarks or game platforms. No downward-looking perspective, no visible floor, no tiny repeated wallpaper patterns. Top and bottom edges should be quiet shaded flat wall for blending; soft detail at edges.
Scene: OFICINA MID HEIGHT, the upper storage area of a maker workshop above its ground floor. Palette: petrol teal painted walls, desaturated teal structural columns at extreme sides, warm amber accents. Side racks with a few large filament rolls and margin tool pegboards, sparse legible objects with softly rounded premium 3D materials. Central wall remains open. No ceiling or roof anywhere in this mid height zone. Soft teal daylight and warm amber accent light. This is a distinct actual upper workshop space, not a repeating tile.
```

## oficina-top

Arquivo: `public/assets/levels/workshop/environment-upper.png`

Prompt:

```text
Use case: stylized-concept. Asset type: vertical climbing game environment background, single distinct height zone. Generate ONE image, portrait 2:3, requested 1024x1536. Premium polished stylized 3D render, full bleed, straight-on front elevation facing a wall, orthographic-like. Keep the central 65-70 percent of image width an open softly textured wall with negative space for separately rendered player and platforms. Place sparse large recognizable environmental details only at extreme side margins. No characters, people, text, UI, logos, watermarks or game platforms. No downward-looking perspective, no visible floor, no tiny repeated wallpaper patterns. Top and bottom edges should be quiet shaded flat wall for blending; soft detail at edges.
Scene: OFICINA TOP HEIGHT, the high ceiling zone of the same maker workshop. Palette: petrol teal walls with desaturated teal metal framing and warm amber accents. Only the upper 20 percent reveals overhead metal trusses, ventilation ducts and high clerestory windows with soft teal daylight. Roof details stay high and near margins, the lower 80 percent remains an open quiet petrol teal wall. A few subtle structural columns at extreme sides. No printers. No floor. Soft warm amber accent light. Distinct actual ceiling zone rather than a repeating tile. Keep bottom edge flat softly shaded teal for blending.
```

## casa-mid

Arquivo: `public/assets/levels/home/environment-middle.png`

Prompt:

```text
Use case: stylized-concept. Asset type: vertical climbing game environment background, single distinct height zone. Generate ONE image, portrait 2:3, requested 1024x1536. Premium polished stylized 3D render, full bleed, straight-on front elevation facing a wall, orthographic-like. Keep the central 65-70 percent of image width an open softly textured wall with negative space for separately rendered player and platforms. Place sparse large recognizable environmental details only at extreme side margins. No characters, people, text, UI, logos, watermarks or game platforms. No downward-looking perspective, no visible floor, no tiny repeated wallpaper patterns. Top and bottom edges should be quiet shaded flat wall for blending; soft detail at edges.
Scene: CASA MID HEIGHT, an upper living-space wall of a cozy creative home. Palette: muted eucalyptus green plaster walls and honey oak wood details. A tall sunlit window is cropped at the extreme left edge and a few wall-mounted plants and sparse books on small shelves stay at extreme right edge. Sparse larger recognizable objects, soft organic foliage and beautifully rendered honey oak. Central 65-70 percent remains open eucalyptus plaster. No floor, ceiling, rafters or roof anywhere in this middle height zone. Warm gentle daylight. The top and bottom of central wall are quiet and shaded to blend with other height zones. This is a distinct actual upper living space, not a repeating tile.
```

## casa-top

Arquivo: `public/assets/levels/home/environment-upper.png`

Prompt:

```text
Use case: stylized-concept. Asset type: vertical climbing game environment background, single distinct height zone. Generate ONE image, portrait 2:3, requested 1024x1536. Premium polished stylized 3D render, full bleed, straight-on front elevation facing a wall, orthographic-like. Keep the central 65-70 percent of image width an open softly textured wall with negative space for separately rendered player and platforms. Place sparse large recognizable environmental details only at extreme side margins. No characters, people, text, UI, logos, watermarks or game platforms. No downward-looking perspective, no visible floor, no tiny repeated wallpaper patterns. Top and bottom edges should be quiet shaded flat wall for blending; soft detail at edges.
Scene: CASA TOP HEIGHT, the high attic/eaves of the same cozy creative home. Palette: muted eucalyptus green plaster walls and honey oak timber. Only the upper 20 percent reveals exposed wood rafters and sloping roof eaves with a small high skylight; climbing foliage remains at extreme side edges. Warm soft daylight from high skylight. Below the rafters, the lower 80 percent is mostly open eucalyptus green plaster wall, with a few honey oak structural vertical elements at margins. No floor. Distinct recognizable actual attic ceiling zone, not a repeating tile. Keep the bottom edge quiet shaded flat eucalyptus wall for blending.
```

## estudio-mid

Arquivo: `public/assets/levels/studio/environment-middle.png`

Prompt:

```text
Use case: stylized-concept. Asset type: vertical climbing game environment background, single distinct height zone. Generate ONE image, portrait 2:3, requested 1024x1536. Premium polished stylized 3D render, full bleed, straight-on front elevation facing a wall, orthographic-like. Keep the central 65-70 percent of image width an open softly textured wall with negative space for separately rendered player and platforms. Place sparse large recognizable environmental details only at extreme side margins. No characters, people, text, UI, logos, watermarks or game platforms. No downward-looking perspective, no visible floor, no tiny repeated wallpaper patterns. Top and bottom edges should be quiet shaded flat wall for blending; soft detail at edges.
Scene: ESTUDIO MID HEIGHT, the upper recording-room wall of a premium music and performance studio. Palette: midnight indigo, muted violet and cyan accents. A few large acoustic panels at the extreme sides, suspended audio cables staying near side margins and sparse cropped rack equipment at an edge. Keep the central 65-70 percent open midnight blue acoustic wall with a very subtle soft textile texture, not a repeating pattern. No floor and no ceiling or roof in this middle height zone. Soft atmospheric cyan and violet edge lights, restrained saturation and no dramatic beams. Distinct actual upper recording-room space, not a repeating tile.
```

## estudio-top

Arquivo: `public/assets/levels/studio/environment-upper.png`

Prompt:

```text
Use case: stylized-concept. Asset type: vertical climbing game environment background, single distinct height zone. Generate ONE image, portrait 2:3, requested 1024x1536. Premium polished stylized 3D render, full bleed, straight-on front elevation facing a wall, orthographic-like. Keep the central 65-70 percent of image width an open softly textured wall with negative space for separately rendered player and platforms. Place sparse large recognizable environmental details only at extreme side margins. No characters, people, text, UI, logos, watermarks or game platforms. No downward-looking perspective, no visible floor, no tiny repeated wallpaper patterns. Top and bottom edges should be quiet shaded flat wall for blending; soft detail at edges.
Scene: ESTUDIO TOP HEIGHT, high performance studio ceiling above the recording room. Palette: midnight indigo, muted violet and cyan accents. The upper 20 percent reveals a high overhead lighting rig and metal trusses, with just a few soft lamps or spots at the top and margins and extremely subdued light shafts. Lower 80 percent remains an open quiet midnight blue acoustic wall. Sparse cables descend only at the extreme side edges. No floor, instruments, console or game platforms. Restrained cyan and violet lights keep central wall calm. Distinct actual studio ceiling zone, not a repeating tile. Keep bottom edge flat softly shaded blue for blending.
```
