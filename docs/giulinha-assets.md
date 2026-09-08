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

On 2026-09-08 the user supplied replacement transparent 2048×2048 PNGs, each
with 64 regularly spaced 256×256 frames. These now load directly using the
same spritesheet loader as Mib and Angel; the obsolete irregular-grid importer
has been removed. The files were copied without modifying their image data
into the existing `giulinha/` folder. The foot baseline is now 248px.
All supplied poses and their proportions are preserved.
