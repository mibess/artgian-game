"""Pack Margô's supplied 60-frame sheets for the game. Requires Pillow.

Run: python3 scripts/pack-margo-sheets.py
Original PNGs are preserved; output goes to margo/runtime.
Each action uses one fixed transform, preserving the authored motion.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / 'public/assets/margo'
Image.MAX_IMAGE_PIXELS = 150_000_000
FRAME, COUNT, COLUMNS = 256, 60, 8


def main():
    output = DIRECTORY / 'runtime'
    output.mkdir(exist_ok=True)
    for action in ('idle', 'walk', 'jump'):
        with Image.open(DIRECTORY / f'margo_{action}_sheet.png') as original:
            expected = (8640, 15360) if action == 'idle' else (15360, 8640)
            if original.size != expected:
                raise ValueError(f'{action}: expected source size {expected}')
            source = original.convert('RGBA')
        width, height = source.width // COLUMNS, source.height // COLUMNS
        # Sitting and walking were exported at different source scales. Keep
        # walk and jump identical; align the torso and ground, not the tail.
        scale, anchor_x, baseline = (0.2, 550, 1459) if action == 'idle' else (0.28, 1000, 830)
        sheet = Image.new('RGBA', (FRAME * COLUMNS, FRAME * COLUMNS))
        for index in range(64):
            x, y = (index % COLUMNS) * width, (index // COLUMNS) * height
            frame = source.crop((x, y, x + width, y + height))
            bounds = frame.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
            if (bounds is not None) != (index < COUNT):
                raise ValueError(f'{action}: unexpected occupied/empty cell {index}')
            if index >= COUNT:
                continue
            # Crop a fixed source window, then resize. No per-frame centering.
            left, top = round(anchor_x - 128 / scale), round(baseline - 238 / scale)
            side = round(FRAME / scale)
            if not (left <= bounds[0] and top <= bounds[1] and bounds[2] <= left + side and bounds[3] <= top + side):
                raise ValueError(f'{action} frame {index}: artwork would be clipped')
            packed = frame.crop((left, top, left + side, top + side)).resize((FRAME, FRAME), Image.Resampling.LANCZOS)
            sheet.paste(packed, ((index % COLUMNS) * FRAME, (index // COLUMNS) * FRAME))
        target = output / f'margo_{action}_sheet.png'
        sheet.save(target, optimize=True)
        print(f'{target.relative_to(ROOT)}: {COUNT} frames, {target.stat().st_size:,} bytes')


if __name__ == '__main__':
    main()
