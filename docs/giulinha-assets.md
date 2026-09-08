# Giulinha

Created with built-in ImageGen using the supplied reference: a smiling toddler
with dark curly hair, pink zip tracksuit and white/pink sneakers.

Files follow the existing character directory convention:

- `public/assets/giulinha/giulinha_idle_sheet.png`
- `public/assets/giulinha/giulinha_walk_sheet.png`
- `public/assets/giulinha/giulinha_jump_sheet.png`

Generation brief: preserve the reference identity and outfit in a stylized 3D
render; produce separate idle, right-facing walk and right-facing jump sheets;
request an 8×8 grid with fixed model proportions, centered poses, a shared foot
baseline, no labels and a transparent background. Idle should breathe, blink
and wave; walk should loop; jump should crouch, ascend, descend and recover.

The generated PNGs did not honor the requested grid and transparency. The
source images are 1254×1254 with a baked preview background. The importer in
`src/art/characterSheets.ts` removes that background and isolated artifacts,
uses 48 complete idle frames and 56 walk/jump frames, and maps them to 64 runtime
frames per animation. Repeated poses fill the sequence; these are not 64 unique
generated poses. The clipped final source idle row is excluded.

Each runtime sheet is 2048×2048 with 256×256 cells, like the other characters.
Scale is calibrated from the standing reference once per animation, not per
frame, preserving crouches and raised arms. The foot baseline is 244px.
The source PNGs remain unchanged. Raw sheets require this importer and should
not be loaded directly as regular 256px sprite sheets.
