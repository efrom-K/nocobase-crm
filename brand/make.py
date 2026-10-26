#!/usr/bin/env python3
"""Фирменный кит «Консалт Недвижимость»: векторный знак, логотипы с текстом в кривых, шрифты Fira (woff2, кириллица+латиница).
Нужны fonttools, brotli, uharfbuzz и исходные TTF Fira (github.com/google/fonts, ofl/) в каталоге из аргумента:
    python3 brand/make.py ~/fira-ttf
Результат — в brand/ рядом со скриптом. brand.css и README пишутся руками, скрипт их не трогает."""
import os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools import subset
import uharfbuzz as hb

OUT = os.path.dirname(os.path.abspath(__file__))
TTF = os.path.expanduser(sys.argv[1]) if len(sys.argv) > 1 else None

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


def load(name):
    path = os.path.join(TTF, name)
    return TTFont(path), open(path, 'rb').read()


def svg(w, h, body, title):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g" role="img" aria-label="%s">'
            '<title>%s</title>%s</svg>\n' % (w, h, title, title, body))


def lockup(cond, sans, sq_bg, sq_fg, t_col, s_col, s=100):
    """Горизонтальный блок как в брендбуке: знак s, отступ .32s, надпись .44s прописными, дескриптор .3s."""
    d1, w1 = text_path(cond, 'КОНСАЛТ НЕДВИЖИМОСТЬ', s * .44, s * 1.32, s * .455, tracking=.01)
    d2, w2 = text_path(sans, 'Управляющая компания', s * .30, s * 1.32, s * .835)
    w = s * 1.32 + max(w1, w2)
    sub = '<path fill="%s"%s d="%s"/>' % (s_col[0], ' fill-opacity="%s"' % s_col[1] if s_col[1] != 1 else '', d2)
    return w, s, mark(0, 0, s, sq_bg, sq_fg) + '<path fill="%s" d="%s"/>' % (t_col, d1) + sub


def main():
    w = lambda n, s: open(os.path.join(OUT, n), 'w', encoding='utf-8').write(s)
    w('kn-mark.svg', svg(100, 100, mark(0, 0, 100, NAVY, '#fff'), 'Консалт Недвижимость'))
    w('kn-mark-white.svg', svg(100, 100, mark(0, 0, 100, '#fff', NAVY), 'Консалт Недвижимость'))
    w('kn-glyph.svg', svg(GW, GH, '<path fill="%s" d="%s"/>' % (NAVY, glyph_path(0, 0, GW)), 'КН'))
    if not TTF:
        print('логотипы с надписью и шрифты пропущены: не указан каталог с TTF'); return
    cond, sans = load('FiraSansCondensed-SemiBold.ttf'), load('FiraSans-Regular.ttf')
    for name, args in {
        'kn-logo.svg': (NAVY, '#fff', INK, (MUTED, 1)),                      # на светлом и белом
        'kn-logo-white.svg': ('#fff', NAVY, '#fff', ('#fff', .72)),          # на фирменном синем
        'kn-logo-deep.svg': (NAVY, '#fff', '#fff', ('#fff', .62)),           # на глубоком синем (знак с рамкой не нужен)
        'kn-logo-mono.svg': ('#000', '#fff', '#000', ('#000', 1)),           # монохром для печати
    }.items():
        lw, lh, body = lockup(cond, sans, *args)
        w(name, svg(round(lw + .5), lh, body, 'Консалт Недвижимость — управляющая компания'))
    # шрифты: только нужные начертания, кириллица + латиница + типографика (₽, №, стрелки)
    uni = ('U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+0400-045F,U+0490-0491,U+04B0-04B1,'
           'U+2000-206F,U+20BD,U+2116,U+2122,U+2190-2193,U+2212,U+2215,U+2248,U+2260,U+2264-2265,U+25CF,U+2713,U+2715')
    for src, dst in [('FiraSans-Regular', 'fira-sans-400'), ('FiraSans-Medium', 'fira-sans-500'), ('FiraSans-SemiBold', 'fira-sans-600'),
                     ('FiraSansCondensed-SemiBold', 'fira-sans-condensed-600'), ('FiraMono-Regular', 'fira-mono-400'),
                     ('FiraMono-Medium', 'fira-mono-500')]:
        subset.main([os.path.join(TTF, src + '.ttf'), '--unicodes=' + uni, '--layout-features=*', '--flavor=woff2',
                     '--output-file=' + os.path.join(OUT, dst + '.woff2')])
    print('готово:', OUT)


if __name__ == '__main__':
    main()
