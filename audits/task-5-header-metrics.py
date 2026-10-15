#!/usr/bin/env python3
"""
Расчёт раскладки шапки BRIIX (.header-inner) по метрикам реальных шрифтов.
Отчёт — audits/task-5-header-report.md, issue #5.

Две части:
1. Ширина текста. Advance-ширины глифов читаются из настоящих
   assets/fonts/*.woff2 (fontTools, переменный шрифт инстанцируется в нужный
   wght), плюс кернинг-пары GPOS и letter-spacing.
2. Раскладка. Одна flex-строка, gap 24px, без переноса. Элементы в порядке DOM:
   .logo, .nav, .header-cta, .burger. .logo и .header-cta — flex: none;
   у .burger flex-shrink: 1 и min-content 32px; у .nav min-content равен
   max-content (все строки nowrap), то есть фактически не сжимается.
   Контейнер: max-width 1160px + padding 0 24px, поэтому доступная ширина
   = min(V, 1160) − 48, а левый отступ = (V − min(V, 1160)) / 2.

Это НЕ браузер. Не учитываются хинтинг и субпиксельное округление, дробный
devicePixelRatio, лигатуры, системные настройки интервалов.
Кросс-валидация модели — в отчёте: она воспроизводит замер из браузера
(499px и 29px на вьюпорте 470px).

Запуск:  python3 audits/task-5-header-metrics.py   (нужен fonttools + brotli)
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTS = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fonts')

_cache = {}


def _font(path, weight):
    key = (path, round(weight))
    if key not in _cache:
        f = TTFont(os.path.join(FONTS, path))
        axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue)
                for a in f['fvar'].axes}
        loc = {}
        if 'wght' in axes:
            lo, dv, hi = axes['wght']
            loc['wght'] = max(lo, min(hi, weight))
        _cache[key] = instancer.instantiateVariableFont(
            f, loc, inplace=True, updateFontNames=False)
    return _cache[key]


def _advance_units(font, ch):
    cmap = font.getBestCmap()
    gid = cmap.get(ord(ch))
    if gid is None:
        return None
    return font['hmtx'][gid][0]


# какой subset обслуживает символ (unicode-range из main.css)
def _file_for(ch):
    o = ord(ch)
    if 0x0301 == o or 0x0400 <= o <= 0x045F or 0x0490 <= o <= 0x0491 \
       or 0x04B0 <= o <= 0x04B1 or o == 0x2116:
        return 'cyrillic'
    if 0x0460 <= o <= 0x052F or 0x1C80 <= o <= 0x1C8A or o == 0x20B4:
        return 'cyrillic-ext'
    if o <= 0x00FF:
        return 'latin'
    return 'latin-ext'


_kern_cache = {}


def _kern_table(font):
    """{(glyphNameA, glyphNameB): xAdvanceDelta} для GPOS lookup type 2."""
    key = id(font)
    if key in _kern_cache:
        return _kern_cache[key]
    pairs = {}
    try:
        gpos = font['GPOS']
    except KeyError:
        _kern_cache[key] = pairs
        return pairs
    glyphOrder = font.getGlyphOrder()
    for lookup in gpos.table.LookupList.Lookup:
        if lookup.LookupType != 2:
            continue
        for st in lookup.SubTable:
            fmt = st.Format
            if fmt == 1:
                for idx, gname in enumerate(st.Coverage.glyphs):
                    if idx >= len(st.PairSet):
                        continue
                    for pvr in st.PairSet[idx].PairValueRecord:
                        v1 = pvr.Value1
                        if v1 and hasattr(v1, 'XAdvance') and v1.XAdvance:
                            pairs[(gname, pvr.SecondGlyph)] = v1.XAdvance
            elif fmt == 2:
                cls1def = st.ClassDef1.classDefs
                cls2def = st.ClassDef2.classDefs
                cov = set(st.Coverage.glyphs)
                buckets1, buckets2 = {}, {}
                for g in glyphOrder:
                    buckets1.setdefault(cls1def.get(g, 0), []).append(g)
                    buckets2.setdefault(cls2def.get(g, 0), []).append(g)
                for i, c1 in enumerate(st.Class1Record):
                    for j, c2 in enumerate(c1.Class2Record):
                        v1 = c2.Value1
                        if not (v1 and getattr(v1, 'XAdvance', 0)):
                            continue
                        for ga in buckets1.get(i, []):
                            if ga not in cov:
                                continue
                            for gb in buckets2.get(j, []):
                                pairs[(ga, gb)] = v1.XAdvance
    _kern_cache[key] = pairs
    return pairs


def _gid(font, ch):
    cmap = font.getBestCmap()
    return cmap.get(ord(ch))


def text_width(s, size, weight, family='manrope', letter_spacing_em=0.0,
               trailing_spacing=True, kern=True):
    """Ширина строки в px: сумма advance + кернинг + letter-spacing."""
    px = 0.0
    ls = letter_spacing_em * size
    prev = None          # (font, glyphName)
    n = 0
    for ch in s:
        path = '%s-%s-wght-normal.woff2' % (family, _file_for(ch))
        f = _font(path, weight)
        g = _gid(f, ch)
        if g is None:
            f = _font('%s-latin-wght-normal.woff2' % family, weight)
            g = _gid(f, ch)
            if g is None:
                px += size * 0.5
                n += 1
                prev = None
                continue
        if kern and prev is not None and prev[0] is f:
            px += _kern_table(f).get((prev[1], g), 0) / f['head'].unitsPerEm * size
        u = f['hmtx'][g][0]
        px += u / f['head'].unitsPerEm * size
        prev = (f, g)
        n += 1
    px += ls * (n if trailing_spacing else max(n - 1, 0))
    return px


#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Расчёт раскладки шапки BRIIX (.header-inner) по метрикам реальных шрифтов.

Модель: одна flex-строка, gap 24px, без переноса.
Элементы (в порядке DOM): .logo, .nav, .header-cta, .burger.
.header-cta и .logo — flex: none (не сжимаются), у .nav и .burger
flex-shrink: 1, но min-width: auto = min-content = той же ширине
(все строки nowrap), то есть фактически не сжимаются тоже.

Контейнер: .container = max-width 1160px + padding 0 24px,
поэтому доступная ширина = min(V, 1160) - 48, а левый отступ
контейнера = (V - min(V,1160)) / 2.

Что НЕ учитывается (см. отчёт, раздел «нужно проверить в браузере»):
хинтинг/субпиксельное округление браузером, дробные devicePixelRatio,
возможные лигатуры, влияние системных настроек межбуквенного интервала.
"""

CONTAINER = 1160.0
PAD = 24.0
GAP = 24.0
BURGER = 44.0
THEME = 42.0          # width/height, box-sizing: border-box
LOGO_MARK = 34.0
LOGO_GAP = 11.0

BRAND = text_width('BRIIX', 21, 800, 'manrope', -0.03)
LOGO = LOGO_MARK + LOGO_GAP + BRAND

NAV_GAP = 6.0
NAV_MARGIN_LEFT = 12.0
NAV_PAD = 28.0        # 14px * 2
BTN_PAD = 44.0        # 22px * 2  (.header-cta .btn)
CTA_GAP = 10.0


def toggle(label):
    """lang-toggle: min-width 42, padding 0 12, border 1px, box-sizing: border-box"""
    t = text_width(label, 13, 700, 'manrope', 0.06)
    return max(42.0, t + 24.0 + 2.0)


def btn(label):
    return text_width(label, 15, 700, 'manrope', -0.01) + BTN_PAD


def nav(label):
    return text_width(label, 15, 550, 'inter', 0.0) + NAV_PAD


LANG = {
    'ru': {'lang': 'EN', 'ghost': 'Смотреть демо', 'primary': 'Показать мои посты',
           'nav': ['Как работает', 'Возможности', 'Кому', 'Тарифы', 'Вопросы']},
    'en': {'lang': 'RU', 'ghost': 'See the demo', 'primary': 'Show my posts',
           'nav': ['How it works', 'Features', 'Who', 'Pricing', 'FAQ']},
}


def cta_width(lang, with_ghost, with_primary):
    parts = []
    if with_ghost:
        parts.append(btn(LANG[lang]['ghost']))
    if with_primary:
        parts.append(btn(LANG[lang]['primary']))
    parts.append(toggle(LANG[lang]['lang']))
    parts.append(THEME)
    return sum(parts) + CTA_GAP * (len(parts) - 1)


def nav_width(lang):
    """Пункты уже посчитаны с паддингами 14*2 — второй раз не прибавляем."""
    ws = [nav(x) for x in LANG[lang]['nav']]
    return sum(ws) + NAV_GAP * (len(ws) - 1) + NAV_MARGIN_LEFT


def available(v):
    return min(v, CONTAINER) - 2 * PAD


def content_left(v):
    return (v - min(v, CONTAINER)) / 2.0 + PAD


# .burger: width 44px, но UA-стили <button> дают padding-inline 6px,
# а внутри — span шириной 20px. min-content = 20 + 6 + 6 = 32px.
# До правки бургер был единственным сжимаемым элементом строки
# (flex-shrink: 1 у всех, flex: none только у .logo и .header-cta) —
# браузер сплющивал его до 32px, и этого не хватало.
BURGER_MIN = 32.0


def solve(items, avail):
    """Одна flex-строка, gap 24px, без переноса.
    items: [(name, base, min, shrink), ...] -> [(name, width), ...]
    Сжатие взвешено по flex-basis (как в спецификации), упирается в min."""
    gaps = GAP * (len(items) - 1)
    meta = dict((n, (b, m, s)) for n, b, m, s in items)
    widths = dict((n, b) for n, b, m, s in items)
    for _ in range(12):
        overflow = sum(widths.values()) + gaps - avail
        if overflow <= 0.0001:
            break
        pool = [(n, meta[n][2] * meta[n][0]) for n in widths
                if meta[n][2] > 0 and widths[n] > meta[n][1] + 1e-6]
        total = sum(f for _, f in pool)
        if total <= 0:
            break
        for n, f in pool:
            widths[n] = max(meta[n][1], widths[n] - overflow * f / total)
    return [(n, widths[n]) for n, _, _, _ in items]


def layout(v, lang, burger_bp=1279, primary_bp=None, hide_nav_below=1280,
           burger_flex_none=False):
    """Возвращает (ширина_документа, детали)."""
    items = []
    items.append(('logo', LOGO, LOGO, 0.0))
    show_nav = v >= hide_nav_below
    if show_nav:
        w = nav_width(lang)
        items.append(('nav', w, w, 1.0))
    show_burger = v <= burger_bp
    ghost = not show_burger            # .header-cta .btn-ghost скрыта при бургере
    primary = True if primary_bp is None else v > primary_bp
    w = cta_width(lang, ghost, primary)
    items.append(('header-cta', w, w, 0.0))
    if show_burger:
        items.append(('burger', BURGER, BURGER if burger_flex_none else BURGER_MIN,
                      0.0 if burger_flex_none else 1.0))

    laid = solve(items, available(v))
    used = sum(w for _, w in laid) + GAP * (len(laid) - 1)
    avail = available(v)
    left = content_left(v)
    right_edge = left + used
    doc = max(float(v), right_edge)
    return doc, {
        'items': laid, 'used': used, 'avail': avail,
        'left': left, 'right_edge': right_edge,
        'overflow_doc': doc - v,
        'overflow_container': max(0.0, used - avail),
        'gap_to_screen_edge': v - right_edge,
    }


VIEWPORTS = [360, 390, 414, 470, 600, 601, 768, 1024, 1080, 1279, 1280, 1440]


def overflow_ranges(lang, lo=320, hi=2400, step=1, **kw):
    """Диапазоны вьюпортов, где шапка создаёт горизонтальную прокрутку."""
    out = []
    start = None
    v = float(lo)
    while v <= hi:
        doc, d = layout(v, lang, **kw)
        bad = doc - v > 0.005
        if bad and start is None:
            start = v
        elif not bad and start is not None:
            out.append((start, v - step))
            start = None
        v += step
    if start is not None:
        out.append((start, float(hi)))
    return out


def report(title, lang, **kw):
    print('\n--- %s / %s ---' % (title, lang.upper()))
    print('%-6s %-8s %-9s %-9s %-10s %-10s %-9s %s'
          % ('V', 'avail', 'used', 'doc', 'overflow', 'past-grid',
             'burger', 'right'))
    for v in VIEWPORTS:
        doc, d = layout(v, lang, **kw)
        burger = [w for n, w in d['items'] if n == 'burger']
        print('%-6d %-8.2f %-9.2f %-9.2f %+9.2f  %+9.2f  %-9s %.2f'
              % (v, d['avail'], d['used'], doc, d['overflow_doc'],
                 d['overflow_container'],
                 ('%.2f' % burger[0]) if burger else '—', d['right_edge']))
    print('вьюпорты с горизонтальной прокруткой: %s'
          % (overflow_ranges(lang, **kw) or 'нет'))


if __name__ == '__main__':
    print('logo=%.2f (logo-mark 34 + gap 11 + BRIIX %.2f)' % (LOGO, BRAND))
    print('burger: base %.2f, min-content %.2f' % (BURGER, BURGER_MIN))
    for lang in ('ru', 'en'):
        print('\n=== %s ===' % lang.upper())
        print('nav (5 пунктов)        = %8.2f' % nav_width(lang))
        print('cta ghost+primary+язык+тема = %8.2f' % cta_width(lang, True, True))
        print('cta primary+язык+тема  = %8.2f' % cta_width(lang, False, True))
        print('cta язык+тема          = %8.2f' % cta_width(lang, False, False))

        # ДО: .header-cta .btn-ghost скрыта ≤1279, primary всегда,
        # бургер сжимается (flex-shrink: 1, min-content 32px)
        report('ДО', lang, primary_bp=None, burger_flex_none=False)
        # ПОСЛЕ: primary скрыта ≤600 (уходит в панель), бургер flex: none
        report('ПОСЛЕ', lang, primary_bp=600, burger_flex_none=True)

