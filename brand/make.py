#!/usr/bin/env python3
"""Фирменный кит «Консалт Недвижимость» (брендбук v1.3): векторный знак, логотипы с текстом в кривых, шрифт Tilda Sans.
Нужны fonttools, brotli, uharfbuzz и вариативный TildaSans-VF.woff2 (ykinvest-site/brandbook/fonts) из аргумента:
    python3 brand/make.py ~/Projects/ykinvest-site/brandbook/fonts/TildaSans-VF.woff2
Результат — в brand/ рядом со скриптом. brand.css и README пишутся руками, скрипт их не трогает."""
import os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.varLib import instancer
import io, shutil
import uharfbuzz as hb

OUT = os.path.dirname(os.path.abspath(__file__))
VF = os.path.expanduser(sys.argv[1]) if len(sys.argv) > 1 else None

NAVY, INK, MUTED = '#1c2d58', '#1f2433', '#5b6478'

# Знак «КН»: многоугольники сняты с исходника 2084 px (kn-logo-source.png), точность ~1 px.
# Монограмма 773 × 769 px, начало координат — её левый верхний угол.
_RAW = [
    [(655, 501), (784, 501), (784, 856.6), (900, 610.7), (900, 1149.5), (784, 911.1), (784, 1270), (655, 1270)],
    [(900, 501), (957.25, 501), (900, 596.3)],
    [(900, 1163.9), (963.9, 1270), (900, 1270)],
    [(1015, 501), (1107.4, 501), (1015, 652.7)],
    [(1015, 1110.5), (1111.1, 1270), (1015, 1270)],
    [(1015, 668.5), (1015, 824), (1300, 824), (1300, 501), (1428, 501), (1428, 1270), (1300, 1270), (1300, 945),
     (1015, 945), (1015, 1096.3), (901.2, 882)],
]
GW, GH = 773, 769


def glyph_path(x0, y0, side):
    """Монограмма шириной side, левый верхний угол в (x0, y0)."""
    k = side / GW
    f = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
    return ''.join('M' + 'L'.join('%s %s' % (f(x0 + (x - 655) * k), f(y0 + (y - 501) * k)) for x, y in p) + 'Z' for p in _RAW)


def mark(x, y, s, bg, fg):
    """Знак: квадрат со стороной s, монограмма — 64% стороны по ширине, по центру."""
    g = s * .64
    return ('<rect x="%g" y="%g" width="%g" height="%g" fill="%s"/>' % (x, y, s, s, bg) +
            '<path fill="%s" d="%s"/>' % (fg, glyph_path(x + (s - g) / 2, y + (s - g * GH / GW) / 2, g)))


def text_path(font, text, size, x, baseline, tracking=0.0):
    """Строка в кривых с кернингом (harfbuzz). Возвращает (d, ширина)."""
    tt, blob = font
    upem = tt['head'].unitsPerEm
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hf = hb.Font(hb.Face(blob)); hb.shape(hf, buf, {'kern': True, 'liga': True})
    gs, order = tt.getGlyphSet(), tt.getGlyphOrder()
    sc, pen_x, parts = size / upem, 0, []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        p = SVGPathPen(gs, lambda v: ('%.2f' % v).rstrip('0').rstrip('.'))
        gs[order[info.codepoint]].draw(TransformPen(p, (sc, 0, 0, -sc, x + (pen_x + pos.x_offset) * sc, baseline - pos.y_offset * sc)))
        parts.append(p.getCommands())
        pen_x += pos.x_advance + tracking * upem
    return ''.join(parts), (pen_x - tracking * upem) * sc


def load(wght):
    """Статичное начертание из вариативного шрифта: (TTFont, байты TTF для harfbuzz)."""
    f = instancer.instantiateVariableFont(TTFont(VF), {'wght': wght})
    f.flavor = None; b = io.BytesIO(); f.save(b)
    return TTFont(io.BytesIO(b.getvalue())), b.getvalue()


def svg(w, h, body, title):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g" role="img" aria-label="%s">'
            '<title>%s</title>%s</svg>\n' % (w, h, title, title, body))


def lockup(cond, sans, sq_bg, sq_fg, t_col, s_col, s=100):
    """Горизонтальный блок как в брендбуке: знак s, отступ .32s, надпись .44s прописными, дескриптор .3s."""
    d1, w1 = text_path(cond, 'КОНСАЛТ НЕДВИЖИМОСТЬ', s * .44, s * 1.32, s * .455, tracking=.01)
    d2, w2 = text_path(sans, 'Инвестиционная управляющая компания', s * .30, s * 1.32, s * .835)
    w = s * 1.32 + max(w1, w2)
    sub = '<path fill="%s"%s d="%s"/>' % (s_col[0], ' fill-opacity="%s"' % s_col[1] if s_col[1] != 1 else '', d2)
    return w, s, mark(0, 0, s, sq_bg, sq_fg) + '<path fill="%s" d="%s"/>' % (t_col, d1) + sub


def main():
    w = lambda n, s: open(os.path.join(OUT, n), 'w', encoding='utf-8').write(s)
    w('kn-mark.svg', svg(100, 100, mark(0, 0, 100, NAVY, '#fff'), 'Консалт Недвижимость'))
    w('kn-mark-white.svg', svg(100, 100, mark(0, 0, 100, '#fff', NAVY), 'Консалт Недвижимость'))
    w('kn-glyph.svg', svg(GW, GH, '<path fill="%s" d="%s"/>' % (NAVY, glyph_path(0, 0, GW)), 'КН'))
    if not VF:
        print('логотипы с надписью и шрифт пропущены: не указан TildaSans-VF.woff2'); return
    cond, sans = load(600), load(400)   # надпись — SemiBold прописные, дескриптор — Regular
    for name, args in {
        'kn-logo.svg': (NAVY, '#fff', INK, (MUTED, 1)),                      # на светлом и белом
        'kn-logo-white.svg': ('#fff', NAVY, '#fff', ('#fff', .72)),          # на фирменном синем
        'kn-logo-deep.svg': (NAVY, '#fff', '#fff', ('#a6c2e8', 1)),           # на графитовом синем (знак с рамкой не нужен)
        'kn-logo-mono.svg': ('#000', '#fff', '#000', ('#000', 1)),           # монохром для печати
    }.items():
        lw, lh, body = lockup(cond, sans, *args)
        w(name, svg(round(lw + .5), lh, body, 'Консалт Недвижимость — инвестиционная управляющая компания'))
    shutil.copyfile(VF, os.path.join(OUT, 'tilda-sans-vf.woff2'))   # вариативный 250–900, кириллица и латиница
    print('готово:', OUT)


if __name__ == '__main__':
    main()
