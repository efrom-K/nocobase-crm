"""Скачать стикерпаки Telegram через Bot API: TG_TOKEN=... python3 tgdl.py name1 name2 → tg/<name>/NN.ext + meta.json"""
import json, os, sys, urllib.request
tok = os.environ['TG_TOKEN']
B = 'https://api.telegram.org/bot%s/' % tok; F = 'https://api.telegram.org/file/bot%s/' % tok
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tg')
for name in sys.argv[1:]:
    s = json.load(urllib.request.urlopen(B + 'getStickerSet?name=' + name, timeout=30))['result']
    d = os.path.join(out, name); os.makedirs(d, exist_ok=True)
    meta = {'name': name, 'title': s['title'], 'stickers': []}
    for i, st in enumerate(s['stickers'], 1):
        p = json.load(urllib.request.urlopen(B + 'getFile?file_id=' + st['file_id'], timeout=30))['result']['file_path']
        fn = '%02d.%s' % (i, p.rsplit('.', 1)[-1])
        if not os.path.exists(os.path.join(d, fn)):
            open(os.path.join(d, fn), 'wb').write(urllib.request.urlopen(F + p, timeout=60).read())
        meta['stickers'].append({'file': fn, 'alt': st.get('emoji', '')})
    json.dump(meta, open(os.path.join(d, 'meta.json'), 'w'), ensure_ascii=False)
    print(name, '|', s['title'], '|', len(s['stickers']), '|', sorted(set(x['file'].split('.')[-1] for x in meta['stickers'])))
