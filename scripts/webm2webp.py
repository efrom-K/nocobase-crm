"""Видеостикеры .webm (VP9 с прозрачностью) → анимированный .webp рядом: Safari/iOS не показывают VP9-альфу, а webp — везде.
    python3 webm2webp.py out/<пак>/*.webm"""
import glob, os, subprocess, sys, tempfile
from PIL import Image
for src in sys.argv[1:]:
    dst = src[:-5] + '.webp'
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['ffmpeg', '-v', 'error', '-y'] + ([] if os.environ.get('VP8') else ['-c:v', 'libvpx-vp9']) + ['-i', src, '-vf', 'fps=20,scale=256:256:force_original_aspect_ratio=decrease',
                        os.path.join(d, '%04d.png')], check=True)
        fr = [Image.open(f).convert('RGBA') for f in sorted(glob.glob(os.path.join(d, '*.png')))]
    if not fr: print('skip', src); continue
    fr[0].save(dst, 'WEBP', save_all=True, append_images=fr[1:], duration=50, loop=0, quality=72, method=4)
print('ok', len(sys.argv) - 1)
