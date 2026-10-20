#!/usr/bin/env python3
"""Стикерпаки CRM: 3D-эмодзи Microsoft Fluent (MIT) + подписи шрифтом Nunito (OFL).
Выход: out/<pack>/NN.webp (512×512, прозрачный фон, белая обводка как у стикеров TG) + out/packs.json.
    python3 make_stickers.py   (рядом нужны src/Nunito.ttf и src/fluent — архив microsoft/fluentui-emoji; копия выхода — deploy/stickers,
    на сервер: tar → svc ~/nocobase/storage/uploads/stickers)
"""
import json, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, 'src/fluent/fluentui-emoji-main/assets')
FONT = os.path.join(HERE, 'src/Nunito.ttf')
MARK = os.path.expanduser('~/Projects/nocobase-crm/deploy/branding/kn-mark.png')
OUT = os.path.join(HERE, 'out')

CORP = [  # (эмодзи-папка, подпись) — пак «Офис»: по-рабочему и с юмором
    ('Thumbs up', 'Принято в работу'), ('Classical building', 'Объект сдан'), ('Smiling face with halo', 'Арендатор доволен'),
    ('Calendar', 'Показ в 15:00'), ('Writing hand', 'Акт подписан'), ('Bar chart', 'Отчёт готов'), ('Check mark button', 'Согласовано'), ('Fire', 'Горит дедлайн'),
    ('Hot beverage', 'Сначала кофе'), ('Handshake', 'Договорились'),
    ('Page facing up', 'Договор подписан'), ('Receipt', 'Счёт оплачен?'), ('Automobile', 'Выехал на объект'),
    ('Office building', 'Я в офисе'), ('House', 'На удалёнке'), ('Thinking face', 'Надо подумать'),
    ('Grinning face with sweat', 'Щас исправлю'), ('Folded hands', 'Спасибо!'), ('Party popper', 'Ура, сдали!'),
    ('Pizza', 'Пятница!'), ('Eyes', 'Посмотрю'),
    ('Hourglass not done', 'Минутку…'), ('Fire extinguisher', 'Тушим пожар'), ('Telephone receiver', 'Перезвоню'),
    ('Exploding head', 'Сколько писем!'), ('Key', 'Ключи у охраны'),
    ('Chart increasing', 'Аренда растёт'), ('Hammer and wrench', 'Заявка в работе'), ('Rocket', 'Погнали!'),
    ('Money bag', 'Оплата пришла'), ('Clipboard', 'Внёс в CRM'),
]
EMO = [  # пак «Эмоции» — без подписей
    'Face with tears of joy', 'Smiling face with sunglasses', 'Zany face', 'Melting face', 'Raising hands', 'Clapping hands',
    'Red heart', 'Smiling face with hearts', 'Pleading face', 'Face with rolling eyes', 'Partying face', 'Hugging face',
    'Face screaming in fear', 'Crying face', 'Winking face', 'Star-struck', 'Nerd face', 'Upside-down face',
    'OK hand', 'Victory hand', 'Waving hand', 'Face with hand over mouth', 'Grimacing face', 'Relieved face',
    'Slightly smiling face', 'Unamused face', 'Face blowing a kiss', 'Hundred points', 'Sparkles', 'Thinking face',
]

def emoji_png(name):
    d = os.path.join(ASSETS, name, '3D')
    if not os.path.isdir(d): d = os.path.join(ASSETS, name, 'Default', '3D')
    return Image.open(os.path.join(d, os.listdir(d)[0])).convert('RGBA')

def outline(img, px):
    """белая обводка по силуэту, как у стикеров Telegram, + мягкая тень"""
    a = img.split()[3]
    grow = a.filter(ImageFilter.MaxFilter(px * 2 + 1))
    shadow = Image.new('RGBA', img.size, (0, 0, 0, 0)); shadow.putalpha(grow.point(lambda v: int(v * .22)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    white = Image.new('RGBA', img.size, (255, 255, 255, 0)); white.putalpha(grow)
    res = Image.new('RGBA', img.size, (0, 0, 0, 0))
    res.alpha_composite(shadow, (0, 4)); res.alpha_composite(white); res.alpha_composite(img)
    return res

def font(size):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_axes([850])
    except Exception: pass
    return f

def sticker(name, caption):
    S = 512
    canvas = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    e = emoji_png(name)
    size = 330 if caption else 420
    e = e.resize((size, size), Image.LANCZOS)
    layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    layer.alpha_composite(e, ((S - size) // 2, 18 if caption else (S - size) // 2))
    canvas.alpha_composite(outline(layer, 10))
    if caption:
        fs = 54
        while True:
            f = font(fs)
            w = ImageDraw.Draw(canvas).textlength(caption, font=f)
            if w <= S - 70 or fs <= 30: break
            fs -= 2
        pad_x, h = 26, fs + 30
        bw = int(w + pad_x * 2); x0 = (S - bw) // 2; y0 = S - h - 22
        bub = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(bub)
        d.rounded_rectangle([x0, y0 + 5, x0 + bw, y0 + h + 5], radius=h // 2, fill=(0, 0, 0, 60))
        bub = bub.filter(ImageFilter.GaussianBlur(5))
        d = ImageDraw.Draw(bub)
        # фирменная плашка «Консалт Недвижимость»: тёмно-синий #1c2d58, белый текст, белая обводка стикера
        d.rounded_rectangle([x0 - 7, y0 - 7, x0 + bw + 7, y0 + h + 7], radius=h // 2 + 7, fill=(255, 255, 255, 255))
        d.rounded_rectangle([x0, y0, x0 + bw, y0 + h], radius=h // 2, fill=(28, 45, 88, 255))
        d.text((S // 2, y0 + h // 2 + 1), caption, font=f, fill=(255, 255, 255, 255), anchor='mm')
        canvas.alpha_composite(bub)
        # знак КН в верхнем левом углу
        m = Image.open(MARK).convert('RGBA').resize((78, 78), Image.LANCZOS)
        ml = Image.new('RGBA', (S, S), (0, 0, 0, 0)); ml.alpha_composite(m, (22, 22))
        canvas.alpha_composite(outline(ml, 6))
    return canvas

def build(key, title, items):
    os.makedirs(os.path.join(OUT, key), exist_ok=True)
    out = []
    for i, it in enumerate(items, 1):
        name, cap = it if isinstance(it, tuple) else (it, None)
        fn = '%02d.webp' % i
        sticker(name, cap).save(os.path.join(OUT, key, fn), 'WEBP', quality=88, method=6)
        out.append({'file': fn, 'alt': cap or name})
    return {'key': key, 'title': title, 'cover': out[0]['file'], 'stickers': out}

packs = [build('office', 'Консалт', CORP), build('emotions', 'Эмоции', EMO)]
json.dump({'packs': packs, 'license': 'Fluent Emoji © Microsoft (MIT); шрифт Nunito (OFL)'}, open(os.path.join(OUT, 'packs.json'), 'w'), ensure_ascii=False, indent=1)
print('ok', sum(len(p['stickers']) for p in packs))
