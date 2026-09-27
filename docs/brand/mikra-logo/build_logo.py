"""
MIKRA logo system -> SVG (text outlined to paths, no font dependency) + PNG via Chrome headless.

Geometry = the site's BrandMark (square-in-square, 5x5 dot grid fading from the centre = the chip),
wordmark = Heebo 300 "מִקְרָא" + Heebo 400 "MIKRA" tracked, exactly the proportions of components/Logo.tsx.
Colours = lib/brand + globals.css tokens.
"""
import os, sys, json, subprocess, shutil, math
sys.stdout.reconfigure(encoding='utf-8')
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
import uharfbuzz as hb

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out'); SVG = os.path.join(OUT, 'svg'); PNG = os.path.join(OUT, 'png')
for d in (SVG, PNG): os.makedirs(d, exist_ok=True)

# ---------- fonts: static instances of the variable Heebo ----------
def instance(w):
    p = os.path.join(HERE, f'Heebo-{w}.ttf')
    if not os.path.exists(p):
        instancer.instantiateVariableFont(TTFont(os.path.join(HERE, 'Heebo.ttf')), {'wght': w}).save(p)
    return p

class Face:
    def __init__(self, path):
        self.ttf = TTFont(path); self.upem = self.ttf['head'].unitsPerEm
        self.gs = self.ttf.getGlyphSet(); self.order = self.ttf.getGlyphOrder()
        blob = hb.Blob.from_file_path(path); face = hb.Face(blob); self.font = hb.Font(face)
        self.font.scale = (self.upem, self.upem)
    def shape(self, text, tracking=0.0):
        """-> (glyph runs [(name, x, y)], total advance, bbox) in font units, visual order L->R"""
        buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
        hb.shape(self.font, buf, {'kern': True, 'liga': True, 'mark': True, 'mkmk': True})
        runs = []; x = 0
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            name = self.order[info.codepoint]
            runs.append((name, x + pos.x_offset, pos.y_offset))
            x += pos.x_advance + tracking * self.upem
        # bounds
        xs = []; ys = []
        for name, gx, gy in runs:
            bp = BoundsPen(self.gs); self.gs[name].draw(bp)
            if bp.bounds:
                x0, y0, x1, y1 = bp.bounds; xs += [gx + x0, gx + x1]; ys += [gy + y0, gy + y1]
        return runs, x, (min(xs), min(ys), max(xs), max(ys))
    def path(self, name):
        pen = SVGPathPen(self.gs); self.gs[name].draw(pen); return pen.getCommands()

heebo300 = Face(instance(300)); heebo400 = Face(instance(400))

def text_svg(face, text, size, x, y, fill, tracking=0.0, anchor='start'):
    """Text as outlined paths. (x,y) = baseline origin; anchor start|middle|end refers to visual box."""
    runs, adv, (bx0, by0, bx1, by1) = face.shape(text, tracking)
    s = size / face.upem
    w = (bx1 - bx0) * s
    if anchor == 'middle': x0 = x - w / 2 - bx0 * s
    elif anchor == 'end': x0 = x - w - bx0 * s
    else: x0 = x - bx0 * s
    parts = []
    for name, gx, gy in runs:
        d = face.path(name)
        if not d: continue
        parts.append(f'<path transform="translate({x0 + gx * s:.3f},{y - gy * s:.3f}) scale({s:.6f},{-s:.6f})" d="{d}"/>')
    box = (x0 + bx0 * s, y - by1 * s, x0 + bx1 * s, y - by0 * s)
    return f'<g fill="{fill}">' + ''.join(parts) + '</g>', box

def mark_svg(x, y, size, color):
    """The chip mark in a size×size box at (x,y). Fade expressed by dot size (prints as one colour)."""
    u = size / 40.0
    out = [f'<g transform="translate({x:.3f},{y:.3f}) scale({u:.6f})" fill="none" stroke="{color}">']
    out.append('<rect x="0.5" y="0.5" width="39" height="39" stroke-width="0.9"/>')
    out.append('<rect x="6" y="6" width="28" height="28" stroke-width="0.7"/>')
    out.append(f'</g><g transform="translate({x:.3f},{y:.3f}) scale({u:.6f})" fill="{color}">')
    for r in range(5):
        for c in range(5):
            d = max(abs(r - 2), abs(c - 2)); sz = [2.1, 1.7, 1.25][d]
            cx = 9 + c * 4 + 0.85; cy = 9 + r * 4 + 0.85
            out.append(f'<rect x="{cx - sz/2:.3f}" y="{cy - sz/2:.3f}" width="{sz}" height="{sz}"/>')
    out.append('</g>')
    return ''.join(out)

# ---------- lockups (all in a 1000-wide coordinate space, padded) ----------
NAME = 'מִקְרָא'; LATIN = 'MIKRA'; SLOGAN = 'פסוקים, מזמורים, משמעות.'

def lockup_horizontal(fg, bg):
    M = 200; pad = 60
    # mark on the right (RTL), text block to its left; proportions of Logo.tsx: name .72*M, latin .235*M, gap .09*M
    name_size = M * 0.72; latin_size = max(M * 0.235, 40)
    name_g, nb = text_svg(heebo300, NAME, name_size, 0, 0, fg, anchor='end')
    latin_g, lb = text_svg(heebo400, LATIN, latin_size, 0, 0, fg, tracking=0.42, anchor='end')
    name_h = nb[3] - nb[1]; block_h = name_h + latin_size * 1.25
    W = pad + (max(nb[2] - nb[0], lb[2] - lb[0])) + M * 0.35 + M + pad
    H = pad + max(M, block_h) + pad
    mark_x = W - pad - M; mark_y = (H - M) / 2
    text_right = mark_x - M * 0.3
    base_name = (H - block_h) / 2 - nb[1]
    name_g, nb = text_svg(heebo300, NAME, name_size, text_right, base_name, fg, anchor='end')
    base_latin = nb[3] + latin_size * 1.15
    latin_g, lb = text_svg(heebo400, LATIN, latin_size, text_right, base_latin, fg, tracking=0.42, anchor='end')
    body = mark_svg(mark_x, mark_y, M, fg) + name_g + latin_g
    return W, H, body

def lockup_stacked(fg, bg, slogan=False):
    M = 220; pad = 70
    name_size = M * 0.78; latin_size = max(M * 0.2, 40); slogan_size = M * 0.17
    W = 900
    cx = W / 2
    y = pad
    body = mark_svg(cx - M / 2, y, M, fg); y += M + M * 0.28
    _, nb = text_svg(heebo300, NAME, name_size, 0, 0, fg, anchor='middle')
    base = y - nb[1]
    name_g, nb = text_svg(heebo300, NAME, name_size, cx, base, fg, anchor='middle'); body += name_g
    base_l = nb[3] + latin_size * 1.2
    latin_g, lb = text_svg(heebo400, LATIN, latin_size, cx, base_l, fg, tracking=0.42, anchor='middle'); body += latin_g
    bottom = lb[3]
    if slogan:
        base_s = lb[3] + slogan_size * 2.1
        sl_g, sb = text_svg(heebo300, SLOGAN, slogan_size, cx, base_s, fg, anchor='middle'); body += sl_g
        bottom = sb[3]
    H = bottom + pad
    return W, H, body

def mark_only(fg, bg):
    M = 400; pad = 60
    return M + 2 * pad, M + 2 * pad, mark_svg(pad, pad, M, fg)

def wordmark_only(fg, bg):
    name_size = 220; latin_size = 60; pad = 70
    _, nb = text_svg(heebo300, NAME, name_size, 0, 0, fg, anchor='middle')
    _, lb = text_svg(heebo400, LATIN, latin_size, 0, 0, fg, tracking=0.42, anchor='middle')
    W = max(nb[2] - nb[0], lb[2] - lb[0]) + 2 * pad; cx = W / 2
    base = pad - nb[1]
    name_g, nb = text_svg(heebo300, NAME, name_size, cx, base, fg, anchor='middle')
    base_l = nb[3] + latin_size * 1.2
    latin_g, lb = text_svg(heebo400, LATIN, latin_size, cx, base_l, fg, tracking=0.42, anchor='middle')
    return W, lb[3] + pad, name_g + latin_g

LOCKUPS = {
    'horizontal': lambda fg, bg: lockup_horizontal(fg, bg),
    'stacked': lambda fg, bg: lockup_stacked(fg, bg),
    'stacked-slogan': lambda fg, bg: lockup_stacked(fg, bg, slogan=True),
    'mark': mark_only,
    'wordmark': wordmark_only,
}
# fg on bg; bg None = transparent
VARIANTS = {
    'gold-on-paper': ('#96661c', '#fbf8f1'),
    'ink-on-paper': ('#16150f', '#fbf8f1'),
    'paper-on-ink': ('#fbf8f1', '#16150f'),
    'gold-on-navy': ('#d9b25e', '#163987'),
    'gold': ('#96661c', None),
    'black': ('#000000', None),
    'white': ('#ffffff', None),
}

def write_svg(name, W, H, body, bg):
    rect = f'<rect width="{W:.2f}" height="{H:.2f}" fill="{bg}"/>' if bg else ''
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.2f} {H:.2f}" width="{W:.2f}" height="{H:.2f}">'
           f'<title>MIKRA {name}</title>{rect}{body}</svg>')
    p = os.path.join(SVG, name + '.svg')
    with open(p, 'w', encoding='utf-8') as f: f.write(svg)
    return p, W, H

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
def render_png(svg_path, W, H, png_path, width_px=2400):
    scale = width_px / W; w = int(round(W * scale)); h = int(round(H * scale))
    html = os.path.join(OUT, '_render.html')
    with open(html, 'w', encoding='utf-8') as f:
        f.write(f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;background:transparent}}img{{display:block;width:{w}px;height:{h}px}}</style></head>'
                f'<body><img src="file:///{svg_path.replace(os.sep, "/")}"></body></html>')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
                    f'--window-size={w},{h}', f'--screenshot={png_path}', 'file:///' + html.replace(os.sep, '/')],
                   capture_output=True, timeout=60)
    return os.path.exists(png_path)

made = []
for lk, fn in LOCKUPS.items():
    for var, (fg, bg) in VARIANTS.items():
        W, H, body = fn(fg, bg)
        name = f'mikra-{lk}-{var}'
        p, W, H = write_svg(name, W, H, body, bg)
        ok = render_png(p, W, H, os.path.join(PNG, name + '.png'))
        made.append((name, round(W), round(H), ok))
for m in made: print(m)
print('svg', len(os.listdir(SVG)), 'png', len(os.listdir(PNG)))
