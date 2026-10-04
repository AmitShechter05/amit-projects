"""Trace the wordmark of the MIKRA logo (raster) into cubic Bezier outlines.

Input : source-light.webp (2000x2000, navy letters on white) - the logo as Amit sent it
Output: wordmark.json  {"w":..,"h":..,"d":"<svg path data>","ink":"#rrggbb"}
        trace_check.png (rendered path over the source, for a visual diff)

The fit is Schneider's algorithm (Graphics Gems): contours are split at
corners, and every run between corners gets as few cubics as stay within
the tolerance.
"""
import json

import cv2
import numpy as np
from PIL import Image

SRC = 'source-light.webp'
UP = 4            # upscale factor before thresholding
TOL = 1.6         # max fit error, in upscaled pixels
CORNER_K = 14     # arm length (upscaled px) for the corner test
CORNER_DEG = 55   # turning angle that counts as a corner
SMOOTH = 2.0      # gaussian sigma along the pixel chain (upscaled px)


# ---------------------------------------------------------------- Schneider
def _norm(v):
    n = np.hypot(*v)
    return v / n if n else v


def _bez(c, t):
    mt = 1 - t
    return (mt ** 3)[:, None] * c[0] + (3 * mt * mt * t)[:, None] * c[1] + (3 * mt * t * t)[:, None] * c[2] + (t ** 3)[:, None] * c[3]


def _chord(pts):
    d = np.hypot(*np.diff(pts, axis=0).T)
    u = np.concatenate([[0], np.cumsum(d)])
    return u / u[-1] if u[-1] else u


def _generate(pts, u, t1, t2):
    b0 = (1 - u) ** 3
    b1 = 3 * u * (1 - u) ** 2
    b2 = 3 * u * u * (1 - u)
    b3 = u ** 3
    a1 = b1[:, None] * t1
    a2 = b2[:, None] * t2
    c00 = (a1 * a1).sum()
    c01 = (a1 * a2).sum()
    c11 = (a2 * a2).sum()
    tmp = pts - ((b0 + b1)[:, None] * pts[0] + (b2 + b3)[:, None] * pts[-1])
    x0 = (a1 * tmp).sum()
    x1 = (a2 * tmp).sum()
    det = c00 * c11 - c01 * c01
    seg = np.hypot(*(pts[-1] - pts[0]))
    if abs(det) > 1e-12:
        al = (x0 * c11 - x1 * c01) / det
        ar = (c00 * x1 - c01 * x0) / det
    else:
        al = ar = 0
    eps = 1e-6 * seg
    if al < eps or ar < eps:
        al = ar = seg / 3
    return np.array([pts[0], pts[0] + t1 * al, pts[-1] + t2 * ar, pts[-1]])


def _reparam(c, pts, u):
    d1 = 3 * (c[1:] - c[:-1])
    d2 = 2 * (d1[1:] - d1[:-1])
    out = u.copy()
    for i, (p, t) in enumerate(zip(pts, u)):
        mt = 1 - t
        q = mt ** 3 * c[0] + 3 * mt * mt * t * c[1] + 3 * mt * t * t * c[2] + t ** 3 * c[3]
        q1 = mt * mt * d1[0] + 2 * mt * t * d1[1] + t * t * d1[2]
        q2 = mt * d2[0] + t * d2[1]
        num = ((q - p) * q1).sum()
        den = (q1 * q1).sum() + ((q - p) * q2).sum()
        if abs(den) > 1e-12:
            out[i] = min(1, max(0, t - num / den))
    return out


def _fit(pts, t1, t2, tol, out):
    if len(pts) == 2:
        d = np.hypot(*(pts[1] - pts[0])) / 3
        out.append(np.array([pts[0], pts[0] + t1 * d, pts[1] + t2 * d, pts[1]]))
        return
    u = _chord(pts)
    c = _generate(pts, u, t1, t2)
    err = ((_bez(c, u) - pts) ** 2).sum(axis=1)
    split = int(err.argmax())
    if err[split] < tol * tol:
        out.append(c)
        return
    if err[split] < (4 * tol) ** 2:
        for _ in range(12):
            u = _reparam(c, pts, u)
            c = _generate(pts, u, t1, t2)
            err = ((_bez(c, u) - pts) ** 2).sum(axis=1)
            split = int(err.argmax())
            if err[split] < tol * tol:
                out.append(c)
                return
    split = min(max(split, 1), len(pts) - 2)
    lo = max(0, split - 3)
    hi = min(len(pts) - 1, split + 3)
    tc = _norm(pts[lo] - pts[hi])
    _fit(pts[: split + 1], t1, tc, tol, out)
    _fit(pts[split:], -tc, t2, tol, out)


def fit_open(pts, tol):
    k = min(4, len(pts) - 1)
    out = []
    _fit(pts, _norm(pts[k] - pts[0]), _norm(pts[-1 - k] - pts[-1]), tol, out)
    return out


# ------------------------------------------------------------------ tracing
def corners(pts):
    n = len(pts)
    k = CORNER_K
    a = pts - np.roll(pts, k, axis=0)
    b = np.roll(pts, -k, axis=0) - pts
    cosang = (a * b).sum(axis=1) / (np.hypot(*a.T) * np.hypot(*b.T) + 1e-9)
    ang = np.degrees(np.arccos(np.clip(cosang, -1, 1)))
    idx = []
    for i in range(n):
        if ang[i] < CORNER_DEG:
            continue
        window = [ang[(i + j) % n] for j in range(-k, k + 1)]
        if ang[i] >= max(window):
            if idx and (i - idx[-1]) < k:
                continue
            idx.append(i)
    return idx


def smooth_closed(pts, sigma):
    r = int(3 * sigma) + 1
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    ext = np.concatenate([pts[-r:], pts, pts[:r]])
    return np.stack([np.convolve(ext[:, 0], k, mode='valid'), np.convolve(ext[:, 1], k, mode='valid')], axis=1)


def trace_contour(pts, tol):
    pts = smooth_closed(pts.astype(np.float64), SMOOTH)
    n = len(pts)
    cs = corners(pts)
    segs = []
    if len(cs) < 2:
        # smooth closed shape (a dot): cut at four points, keep tangents continuous
        cuts = [0, n // 4, n // 2, 3 * n // 4]
        for a, b in zip(cuts, cuts[1:] + [cuts[0] + n]):
            run = np.array([pts[i % n] for i in range(a, b + 1)])
            ta = _norm(pts[(a + 3) % n] - pts[(a - 3) % n])
            tb = _norm(pts[(b - 3) % n] - pts[(b + 3) % n])
            out = []
            _fit(run, ta, tb, tol, out)
            segs += out
        return segs
    for a, b in zip(cs, cs[1:] + [cs[0] + n]):
        run = np.array([pts[i % n] for i in range(a, b + 1)])
        segs += fit_open(run, tol)
    return segs


def main():
    rgb = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
    gray = rgb.mean(axis=2)
    # the wordmark is the second block of non-white rows
    rows = (gray < 235).sum(axis=1)
    runs, start = [], None
    for y, v in enumerate(rows):
        if v and start is None:
            start = y
        if not v and start is not None:
            runs.append((start, y - 1))
            start = None
    y0, y1 = runs[1]
    cols = np.where((gray[y0:y1 + 1] < 235).sum(axis=0))[0]
    x0, x1 = cols.min(), cols.max()
    pad = 6
    crop = gray[y0 - pad:y1 + pad + 1, x0 - pad:x1 + pad + 1]
    ink_rgb = rgb[y0:y1 + 1, x0:x1 + 1][gray[y0:y1 + 1, x0:x1 + 1] < 60]
    ink = np.median(ink_rgb, axis=0)
    dark = float(np.median(gray[y0:y1 + 1, x0:x1 + 1][gray[y0:y1 + 1, x0:x1 + 1] < 60]))
    cov = np.clip((255 - crop) / (255 - dark), 0, 1)
    big = cv2.resize(cov, None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC)
    big = cv2.GaussianBlur(big, (0, 0), 1.2)
    mask = (big > 0.5).astype(np.uint8)
    contours, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    d = []
    nseg = 0
    shapes = []
    for c, h in zip(contours, hier[0]):
        if cv2.contourArea(c) < 30:
            continue
        segs = trace_contour(c[:, 0, :], TOL)
        nseg += len(segs)
        shapes.append(segs)
    # normalise: origin at the ink bbox, one unit = one source pixel
    allp = np.concatenate([np.concatenate(s) for s in shapes])
    mn = allp.min(axis=0)
    mx = allp.max(axis=0)
    for segs in shapes:
        p = (segs[0][0] - mn) / UP
        d.append('M%.1f %.1f' % (p[0], p[1]))
        for s in segs:
            q = (s[1:] - mn) / UP
            d.append('C%.1f %.1f %.1f %.1f %.1f %.1f' % tuple(q.flatten()))
        d.append('Z')
    w = (mx[0] - mn[0]) / UP
    h = (mx[1] - mn[1]) / UP
    path = ''.join(d).replace('.0 ', ' ').replace('.0C', 'C').replace('.0Z', 'Z')
    ink_hex = '#%02x%02x%02x' % tuple(int(round(v)) for v in ink)
    json.dump({'w': round(w, 1), 'h': round(h, 1), 'd': path, 'ink': ink_hex}, open('wordmark.json', 'w'))
    print('shapes', len(shapes), 'segments', nseg, 'path chars', len(path), 'size %.1f x %.1f' % (w, h), 'ink', ink_hex)

    # check: fill the fitted path in the same frame as the mask it came from
    canvas = np.zeros(mask.shape, np.uint8)
    polys = []
    for segs in shapes:
        pts = [_bez(sg, np.linspace(0, 1, 24)) for sg in segs]
        polys.append(np.concatenate(pts).round().astype(np.int32))
    cv2.fillPoly(canvas, polys, 255)
    refb = mask * 255
    diff = cv2.absdiff(canvas, refb)
    print('pixels that differ: %.2f%% of the ink area' % (100 * (diff > 0).sum() / max(1, (refb > 0).sum())))
    print('segments per shape', [len(x) for x in shapes])
    vis = np.dstack([canvas, refb, refb])
    cv2.imwrite('trace_check.png', 255 - vis)


if __name__ == '__main__':
    main()
