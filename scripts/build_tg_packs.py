#!/usr/bin/env python3
"""Паки из Telegram (tg/<name>, скачаны tgdl.py) → out/<key>/NN.webm|webp и дописать их в out/packs.json.
.tgs (Lottie) рендерится rlottie → webm VP9 с прозрачностью (ffmpeg). Плюс свои картинки в конец пака (EXTRA).
    python3 build_tg_packs.py
"""
import json, os, shutil, subprocess, tempfile
from PIL import Image, ImageDraw
from rlottie_python import LottieAnimation

HERE = os.path.dirname(os.path.abspath(__file__))
TG, OUT = os.path.join(HERE, 'tg'), os.path.join(HERE, 'out')
PACKS = [  # (папка tg, ключ, нормальное название)
    ('supermegahype', 'memes', 'Мемы'),
    ('LLTFUFBDYD_by_stikeri_stikeri_bot', 'cats', 'Котики'),
    ('HANGSEED9', 'cute', 'Милота'),
    ('Chipushilina', 'smiles', 'Смайлики'),
]
EXTRA = {'memes': [os.path.expanduser('~/Desktop/2026-10-20 11.13.12.jpg')]}

def tgs_to_webm(src, dst):
    anim = LottieAnimation.from_tgs(src)
    n, fps = anim.lottie_animation_get_totalframe(), anim.lottie_animation_get_framerate()
    with tempfile.TemporaryDirectory() as d:
        for i in range(n):
            anim.render_pillow_frame(frame_num=i, width=512, height=512).save(os.path.join(d, '%04d.png' % i))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', os.path.join(d, '%04d.png'),
                        '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '38', '-an', dst], check=True)

def picture_sticker(src, dst):
    """своя картинка → квадрат 512 со скруглёнными углами и белой рамкой, как у стикеров"""
    im = Image.open(src).convert('RGBA')
    s = min(im.size); im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2)).resize((472, 472), Image.LANCZOS)
    mask = Image.new('L', (472, 472), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, 471, 471], radius=70, fill=255)
    card = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle([6, 6, 505, 505], radius=88, fill=(255, 255, 255, 255))
    card.paste(im, (20, 20), mask)
    card.save(dst, 'WEBP', quality=88)

manifest = json.load(open(os.path.join(OUT, 'packs.json')))
manifest['packs'] = [p for p in manifest['packs'] if p['key'] not in {k for _, k, _ in PACKS}]
for folder, key, title in PACKS:
    meta = json.load(open(os.path.join(TG, folder, 'meta.json')))
    d = os.path.join(OUT, key); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    items = []
    for st in meta['stickers']:
        src = os.path.join(TG, folder, st['file'])
        base, ext = os.path.splitext(st['file'])
        if ext == '.tgs':
            fn = base + '.webm'; tgs_to_webm(src, os.path.join(d, fn))
        else:
            fn = st['file']; shutil.copy(src, os.path.join(d, fn))
        items.append({'file': fn, 'alt': st['alt']})
    for i, pic in enumerate(EXTRA.get(key, []), len(items) + 1):
        fn = '%02d.webp' % i; picture_sticker(pic, os.path.join(d, fn)); items.append({'file': fn, 'alt': '👉'})
    manifest['packs'].append({'key': key, 'title': title, 'cover': items[0]['file'], 'stickers': items})
    print(key, title, len(items))
manifest['license'] += '; паки «Мемы», «Котики», «Милота», «Смайлики» — из Telegram, для внутреннего использования'
json.dump(manifest, open(os.path.join(OUT, 'packs.json'), 'w'), ensure_ascii=False, indent=1)
