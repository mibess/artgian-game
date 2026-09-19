"""Pack the user's original bee frames deterministically; requires Pillow.
Run: python3 scripts/pack-bee-sheets.py
No AI regeneration, frame duplication, or per-frame recentering.
"""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / 'public/assets/levels/garden/animations'
FRAME = 128
COUNT = 60
COLUMNS = 8


def main():
    sequences = {}
    bounds = []
    for action in ('idle', 'warn'):
        files = sorted((DIRECTORY / f'bee-{action}-sheet').glob('frame_*.png'))
        expected = [f'frame_{i:03}.png' for i in range(1, COUNT + 1)]
        if [file.name for file in files] != expected:
            raise ValueError(f'{action}: expected {COUNT} sequential frames')
        sequences[action] = files
        for file in files:
            with Image.open(file) as source:
                if source.size != (1920, 1080):
                    raise ValueError(f'Unexpected source size: {file}')
                bound = source.convert('RGBA').getchannel('A').point(lambda value: 255 if value > 24 else 0).getbbox()
                if not bound:
                    raise ValueError(f'Empty frame: {file}')
                bounds.append(bound)
    # One shared crop and scale for both actions: preserve authored movement and size.
    crop = (min(b[0] for b in bounds), min(b[1] for b in bounds),
            max(b[2] for b in bounds), max(b[3] for b in bounds))
    width, height = crop[2] - crop[0], crop[3] - crop[1]
    scale = (FRAME - 8) / max(width, height)
    size = (round(width * scale), round(height * scale))
    offset = ((FRAME - size[0]) // 2, (FRAME - size[1]) // 2)
    for action, files in sequences.items():
        sheet = Image.new('RGBA', (COLUMNS * FRAME, COLUMNS * FRAME))
        for i, file in enumerate(files):
            with Image.open(file) as source:
                frame = source.convert('RGBA').crop(crop).resize(size, Image.Resampling.LANCZOS)
                sheet.paste(frame, ((i % COLUMNS) * FRAME + offset[0], (i // COLUMNS) * FRAME + offset[1]))
        output = DIRECTORY / f'bee_{action}_sheet.png'
        sheet.save(output, optimize=True)
        print(f'{output.relative_to(ROOT)}: {COUNT} frames, {output.stat().st_size:,} bytes')
    (DIRECTORY / 'bee-sheets.json').write_text(json.dumps({
        'frameWidth': FRAME, 'frameHeight': FRAME, 'columns': COLUMNS,
        'frameCount': COUNT, 'sharedSourceCrop': crop,
        'idleFrameRate': 24, 'warningFrames': [0, 15], 'crossingFrames': [16, 59],
    }, indent=2) + '\n')


if __name__ == '__main__':
    main()
