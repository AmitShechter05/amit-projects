"""Build the MIKRA logo assets from the measured mark geometry + traced wordmark.

Run trace.py first (it writes wordmark.json), then this file, both from brand/logo.
Copy out/Logo.tsx to components/, out/icon.svg and out/apple-icon.png to app/.

Writes:
  out/Logo.tsx            the site component (BrandMark + Logo)
  out/icon.svg            favicon (the mark alone, transparent)
  out/apple-icon.png      180x180, navy ground
  out/svg/*.svg           standalone vector logos for the user
"""
import json
import os

import numpy as np
from PIL import Image

W = json.load(open('wordmark.json'))
WM_W, WM_H, WM_D, INK = W['w'], W['h'], W['d'], W['ink']
BODY = 197.0            # height of the letter bodies (top of letters to baseline), in wordmark units

NAVY = '#0e1627'
BLUE = '#1f459c'
BAND = '#0d1526'
EDGE = '#cdd0ce'
LINE = '#959693'
CREAM = '#e8dfce'
NAVY_BG = '#0b1423'

# radii measured on the 2000px source (half-diagonal 470.5), scaled to 50
R_OUT, R_EDGE, R_SILVER, R_LINE, R_BEVEL, R_BAND, R_BLUE = 50, 47.82, 46.86, 41.87, 41.34, 38.79, 34.38

SHEEN = [(0, '#b6b7b4'), (.13, '#bcbdba'), (.25, '#f5f5f3'), (.37, '#bcbdba'), (.5, '#b6b7b4'),
         (.63, '#bcbdba'), (.75, '#f5f5f3'), (.87, '#bcbdba'), (1, '#b6b7b4')]
BEVEL = [(0, '#f0f2f2'), (.25, '#bcbebd'), (.5, '#a6a8a6'), (.75, '#bcbebd'), (1, '#f0f2f2')]


def f(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    return s if s != '-0' else '0'


def diamond(r, rho=0.0, c=50.0):
    """Square standing on its corner, half-diagonal r, optional corner rounding rho."""
    v = [(c, c - r), (c + r, c), (c, c + r), (c - r, c)]
    if not rho:
        return 'M' + 'L'.join('%s %s' % (f(x), f(y)) for x, y in v) + 'Z'
    k = rho / (r * 2 ** .5)          # fraction of the side to cut at each corner
    d = []
    for i in range(4):
        p, q, n = v[i - 1], v[i], v[(i + 1) % 4]
        a = (q[0] + (p[0] - q[0]) * k, q[1] + (p[1] - q[1]) * k)
        b = (q[0] + (n[0] - q[0]) * k, q[1] + (n[1] - q[1]) * k)
        d.append(('M' if i == 0 else 'L') + '%s %s' % (f(a[0]), f(a[1])))
        d.append('Q%s %s %s %s' % (f(q[0]), f(q[1]), f(b[0]), f(b[1])))
    return ''.join(d) + 'Z'


def layers(sheen_id, bevel_id):
    return [
        (diamond(R_OUT), NAVY),
        (diamond(R_EDGE), EDGE),
        (diamond(R_SILVER), 'url(#%s)' % sheen_id),
        (diamond(R_LINE, 2.2), LINE),
        (diamond(R_BEVEL, 1.7), 'url(#%s)' % bevel_id),
        (diamond(R_BAND), BAND),
        (diamond(R_BLUE), BLUE),
    ]


def grads(sheen_id, bevel_id, indent='  '):
    def g(i, stops):
        s = ''.join('<stop offset="%s" stop-color="%s"/>' % (f(o), c) for o, c in stops)
        return '%s<linearGradient id="%s" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">%s</linearGradient>' % (indent, i, s)
    return g(sheen_id, SHEEN) + '\n' + g(bevel_id, BEVEL)


def mark_svg_body(sheen_id='s', bevel_id='b', indent='  '):
    out = [indent + '<defs>', grads(sheen_id, bevel_id, indent + '  '), indent + '</defs>']
    for d, fill in layers(sheen_id, bevel_id):
        out.append('%s<path d="%s" fill="%s"/>' % (indent, d, fill))
    return '\n'.join(out)


os.makedirs('out/svg', exist_ok=True)

# ------------------------------------------------------------- favicon
open('out/icon.svg', 'w', encoding='utf-8', newline='\n').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n'
    '  <!-- סמל הלוגו: השבב הכחול במסגרת הכסף, עומד על הקודקוד. אותה גאומטריה\n'
    '       של BrandMark ב-components/Logo.tsx. בלי רקע, כדי שהסמל ימלא את הלשונית. -->\n'
    + mark_svg_body() + '\n</svg>\n')

# ------------------------------------------------------ standalone logos
GAP = 6.5                      # between the mark and the wordmark, in mark units (mark = 100); measured: 61px of 941
wm_scale = 84 / WM_W           # wordmark width relative to the mark width (measured: 789 / 941)
vh = 100 + GAP + WM_H * wm_scale


def vertical(bg, ink, name):
    body = mark_svg_body(indent='    ')
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -40 180 %s">\n' % f(vh + 80)
           + ('  <rect x="-40" y="-40" width="180" height="%s" fill="%s"/>\n' % (f(vh + 80), bg) if bg else '')
           + '  <g>\n' + body + '\n  </g>\n'
           + '  <path transform="translate(%s %s) scale(%s)" d="%s" fill="%s"/>\n' % (f(50 - WM_W * wm_scale / 2), f(100 + GAP), f(wm_scale), WM_D, ink)
           + '</svg>\n')
    open('out/svg/' + name, 'w', encoding='utf-8', newline='\n').write(svg)


vertical(None, INK, 'mikra-logo-vertical.svg')
vertical('#ffffff', INK, 'mikra-logo-vertical-white.svg')
vertical(NAVY_BG, CREAM, 'mikra-logo-vertical-navy.svg')
open('out/svg/mikra-mark.svg', 'w', encoding='utf-8', newline='\n').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n' + mark_svg_body() + '\n</svg>\n')
open('out/svg/mikra-wordmark.svg', 'w', encoding='utf-8', newline='\n').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s">\n  <path d="%s" fill="%s"/>\n</svg>\n' % (f(WM_W), f(WM_H), WM_D, INK))
# horizontal: mark on the right (RTL reading order), letter bodies centred on the mark
hs = 62 / BODY                 # letter-body height = 62% of the mark height
hw = WM_W * hs
open('out/svg/mikra-logo-horizontal.svg', 'w', encoding='utf-8', newline='\n').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s 100">\n' % f(hw + 24 + 100)
    + '  <path transform="translate(0 %s) scale(%s)" d="%s" fill="%s"/>\n' % (f(50 - BODY * hs / 2), f(hs), WM_D, INK)
    + '  <g transform="translate(%s 0)">\n' % f(hw + 24) + mark_svg_body(indent='    ') + '\n  </g>\n</svg>\n')


# ---------------------------------------------------------- apple icon
def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32)


def ramp(stops, t):
    out = np.zeros(t.shape + (3,), np.float32)
    for (o0, c0), (o1, c1) in zip(stops, stops[1:]):
        m = (t >= o0) & (t <= o1)
        k = ((t - o0) / (o1 - o0))[..., None]
        out = np.where(m[..., None], hexrgb(c0) * (1 - k) + hexrgb(c1) * k, out)
    return out


def raster(size, ground, r_frac, ss=8):
    n = size * ss
    y, x = np.mgrid[0:n, 0:n].astype(np.float32)
    u = (x + .5) / n * 100
    v = (y + .5) / n * 100
    scale = r_frac * 100 / 50          # mark half-diagonal as a fraction of the icon width
    du = (u - 50) / scale
    dv = (v - 50) / scale
    dist = np.abs(du) + np.abs(dv)     # diamond "radius" in mark units
    t = np.clip((du + 50) / 100, 0, 1)
    img = np.broadcast_to(hexrgb(ground), (n, n, 3)).copy()
    for r, fill in [(R_OUT, NAVY), (R_EDGE, EDGE), (R_SILVER, SHEEN), (R_LINE, LINE), (R_BEVEL, BEVEL), (R_BAND, BAND), (R_BLUE, BLUE)]:
        col = ramp(fill, t) if isinstance(fill, list) else np.broadcast_to(hexrgb(fill), (n, n, 3))
        img = np.where((dist <= r)[..., None], col, img)
    im = Image.fromarray(img.round().astype(np.uint8)).resize((size, size), Image.LANCZOS)
    return im


raster(180, NAVY_BG, 0.34).save('out/apple-icon.png')

# ------------------------------------------------------------ Logo.tsx
ls = layers('${sheen}', '${bevel}')


def stops_jsx(stops):
    return '\n'.join('          <stop offset="%s" stopColor="%s" />' % (f(o), c) for o, c in stops)


paths_jsx = []
for d, fill in ls:
    if fill.startswith('url('):
        gid = 'sheen' if 'sheen' in fill else 'bevel'
        paths_jsx.append('      <path d="%s" fill={`url(#${%s})`} />' % (d, gid))
    else:
        paths_jsx.append('      <path d="%s" fill="%s" />' % (d, fill))

tsx = '''import { useId } from 'react';
import { BRAND } from '@/lib/brand';

/**
 * הלוגו של מקרא, כפי שעמית מסר אותו (4.10.2026): השבב הכחול במסגרת
 * הכסף, עומד על הקודקוד, ומתחתיו השם באות ספר מנוקדת.
 *
 * הלוגו הגיע כתמונה. המעוין נבנה כאן מחדש לפי המידות והצבעים שנמדדו
 * בה, והכיתוב שורטט מהאותיות עצמן (160 קטעי בזייה, סטייה של פחות
 * מפיקסל ברוחב 3,200) - הוא ציור של הלוגו ולא גופן, ולכן הכלל "גופן
 * אחד באתר" לא נוגע לו. המקור והסקריפטים ב-brand/logo: trace.py משרטט
 * את הכיתוב, build.py כותב את הקובץ הזה, את האייקונים ואת קובצי ה-SVG.
 *
 * כאן ישב קודם סמל אחר - ריבוע חרוט ובתוכו רשת נקודות, בזהב - עם השם
 * ב-Heebo ו-MIKRA בלטינית מתחתיו. בלוגו החדש אין שורה לטינית.
 */

const NAVY = '#NAVYINK';

/* רוחב, גובה וקו הבסיס של הכיתוב ביחידות של הציור. גוף האותיות הוא
   0 עד BODY; מתחתיו רגל הקו״ף והניקוד */
const WM_W = __WM_W__;
const WM_H = __WM_H__;
const BODY = __BODY__;
const WORDMARK =
  '__WM_D__';

/** הסמל: שבב כחול במסגרת כסף. size הוא הרוחב והגובה של המעוין כולו */
export function BrandMark({ size = 34 }: { size?: number }) {
  // לכל מופע מזהים משלו: הלוגו מופיע שלוש פעמים בעמוד, ואחד מהם בתוך
  // תפריט מוסתר - גרדיאנט שמוגדר ב-SVG מוסתר אינו נצבע באחרים
  const id = useId();
  const sheen = `${id}s`;
  const bevel = `${id}b`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className="shrink-0">
      <defs>
        {/* הברק על המסגרת: בהיר באמצע כל צלע, כהה בקודקודים */}
        <linearGradient id={sheen} x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
__SHEEN__
        </linearGradient>
        <linearGradient id={bevel} x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
__BEVEL__
        </linearGradient>
      </defs>
__PATHS__
    </svg>
  );
}

/**
 * הנעילה המלאה: סמל + שם.
 *
 * ברירת המחדל אופקית (הסמל מימין, כסדר הקריאה), כי כותרת האתר נמוכה.
 * stacked הוא הלוגו כפי שנמסר: הסמל מעל השם.
 */
export default function Logo({ size = 32, stacked = false }: { size?: number; stacked?: boolean }) {
  const mark = size * 1.18;
  // גובה גוף האותיות. באופקי תיבת הציור מורחבת כלפי מעלה באותה מידה
  // שהניקוד יורד למטה, כך שמרכז התיבה הוא מרכז האותיות ולא מרכז הציור
  const body = size * (stacked ? 0.52 : 0.6);
  const top = stacked ? 0 : -__PAD__;
  const boxH = WM_H - top;

  return (
    <span
      className={`inline-flex items-center ${stacked ? 'flex-col' : ''}`}
      style={{ gap: size * (stacked ? 0.22 : 0.3), color: NAVY }}
    >
      <BrandMark size={mark} />
      <svg
        role="img"
        aria-label={BRAND.name}
        width={(body * WM_W) / BODY}
        height={(body * boxH) / BODY}
        viewBox={`0 ${top} ${WM_W} ${boxH}`}
        fill="currentColor"
        className="shrink-0"
      >
        <path d={WORDMARK} />
      </svg>
    </span>
  );
}
'''
tsx = (tsx.replace('#NAVYINK', INK).replace('__WM_W__', f(WM_W)).replace('__WM_H__', f(WM_H)).replace('__BODY__', f(BODY))
       .replace('__WM_D__', WM_D).replace('__SHEEN__', stops_jsx(SHEEN)).replace('__BEVEL__', stops_jsx(BEVEL))
       .replace('__PATHS__', '\n'.join(paths_jsx)).replace('__PAD__', f(WM_H - BODY)))
open('out/Logo.tsx', 'w', encoding='utf-8', newline='\n').write(tsx)
print('Logo.tsx', len(tsx), 'chars | wordmark', WM_W, WM_H, 'ink', INK, '| descent', f(WM_H - BODY))
print(open('out/icon.svg', encoding='utf-8').read()[:900])
