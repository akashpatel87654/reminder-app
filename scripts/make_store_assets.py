# Play Store graphics for Pingo. Run from the repo root:
#   python3 scripts/make_store_assets.py <raw-screens-dir>
# Raw screens are plain simulator screenshots named 1.png … 7.png (see SHOTS below).
# Writes store/: icon-512.png, feature-graphic-1024x500.png, screenshot-1.png … (1080x1920).
import os
import sys

from PIL import Image, ImageDraw, ImageFont

BOLD = 'node_modules/@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf'
MONO = 'node_modules/@expo-google-fonts/dm-mono/500Medium/DMMono_500Medium.ttf'
INK, CREAM, LIME, PINK, PURPLE, YELLOW, MINT, ORANGE = (
    '#141414', '#FFF8EC', '#C6F432', '#FF7AC6', '#9B7BFF', '#FFE14D', '#5EE6C8', '#FF8A3D')

# (raw file, background, headline lines, small label)
SHOTS = [
    ('1.png', PINK, ['never get surprise', 'charged again.'], 'YOUR SPEND, AT A GLANCE'),
    ('2.png', LIME, ['every sub in', 'one place.'], 'TRIALS · RENEWALS · EXPIRIES'),
    ('3.png', PURPLE, ['add when you bought it.', 'we do the math.'], 'NEXT RENEWAL, AUTOMATICALLY'),
    ('4.png', YELLOW, ['pick exactly when', 'we nag you.'], 'ANY DAY BEFORE IT CHARGES'),
    ('5.png', MINT, ['a ping before', 'your money dips.'], 'APP NOTIFICATION + EMAIL'),
    ('6.png', ORANGE, ['see where it', 'all goes.'], 'SPEND BY CATEGORY'),
    ('7.png', CREAM, ['tune how hard', 'we nag you.'], 'YOUR TIME · YOUR DAYS'),
]

W, H = 1080, 1920
STATUS_BAR_PX = 150  # iPhone 17 Pro @3x


def font(path, size):
    return ImageFont.truetype(path, size)


def logo(size, dot=True):
    """Lime P on an ink tile with the pink ping dot (same mark as scripts/make_icons.py)."""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = size * 0.06
    b = size - 2 * pad
    d.rounded_rectangle([pad, pad, pad + b, pad + b], radius=b * 0.25, fill=INK)
    d.text((size / 2 - b * 0.02, size / 2 + b * 0.02), 'P', font=font(BOLD, int(b * 0.72)), fill=LIME, anchor='mm')
    if dot:
        r = b * 0.17
        cx, cy = pad + b - r * 0.55, pad + r * 0.55
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=PINK, outline=INK, width=max(2, int(b * 0.035)))
    return im


def card(shot, w, h, radius=56, border=10):
    """Screenshot cropped to w×h (top part), rounded, with an ink border."""
    s = shot.convert('RGB')
    s = s.crop((0, STATUS_BAR_PX, s.width, s.height))  # drop the status bar (clock, dev-build breadcrumb)
    s = s.resize((w, round(s.height * w / s.width)), Image.LANCZOS).crop((0, 0, w, h))
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h + radius], radius=radius, fill=255)  # open at the bottom
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(s, (0, 0), mask)
    ImageDraw.Draw(out).rounded_rectangle([0, 0, w - 1, h + radius], radius=radius, outline=INK, width=border)
    return out


def screenshot(raw, bg, lines, label, out):
    im = Image.new('RGB', (W, H), bg)
    d = ImageDraw.Draw(im)
    d.text((80, 96), label, font=font(MONO, 34), fill=INK)
    y = 150
    for line in lines:
        f = font(BOLD, 96)
        while d.textlength(line, font=f) > W - 160:
            f = font(BOLD, f.size - 4)
        d.text((76, y), line, font=f, fill=INK)
        y += int(f.size * 1.05)
    top = y + 60
    cw, ch = 860, H - top + 10
    c = card(Image.open(raw), cw, ch)
    x = (W - cw) // 2
    d.rounded_rectangle([x + 22, top + 22, x + cw + 22, H + 80], radius=56, fill=INK)  # hard offset shadow
    im.paste(c, (x, top), c)
    im.save(out, optimize=True)


def feature_graphic(out):
    im = Image.new('RGB', (1024, 500), LIME)
    d = ImageDraw.Draw(im)
    # decorative stickers, design-system style
    d.ellipse([-90, 380, 90, 560], fill=PINK, outline=INK, width=6)
    d.rounded_rectangle([880, -50, 1080, 130], radius=40, fill=PURPLE, outline=INK, width=6)
    m = logo(250)
    d.rounded_rectangle([84 + 14, 125 + 14, 84 + 250 + 14 - 15, 125 + 250 + 14 - 15], radius=55, fill=PINK)
    im.paste(m, (84, 125), m)
    d.text((385, 140), 'Pingo', font=font(BOLD, 120), fill=INK)
    tag, tf = 'never get surprise charged again.', font(BOLD, 40)
    while d.textlength(tag, font=tf) > 1024 - 390 - 40:
        tf = font(BOLD, tf.size - 2)
    d.text((390, 285), tag, font=tf, fill=INK)
    pill = 'subscriptions, handled.'
    pf = font(MONO, 28)
    pw = d.textlength(pill, font=pf)
    d.rounded_rectangle([390, 350, 390 + pw + 44, 400], radius=25, fill=INK)
    d.text((412, 375), pill, font=pf, fill=LIME, anchor='lm')
    im.save(out, optimize=True)


def icon(out):
    im = Image.new('RGBA', (512, 512), LIME)
    m = logo(300)
    im.paste(m, (106, 106), m)
    im.convert('RGB').save(out, optimize=True)  # Play: 512x512 PNG, full-bleed square (Play rounds it)


if __name__ == '__main__':
    raw_dir = sys.argv[1] if len(sys.argv) > 1 else 'store/raw'
    os.makedirs('store', exist_ok=True)
    icon('store/icon-512.png')
    feature_graphic('store/feature-graphic-1024x500.png')
    n = 0
    for i, (f, bg, lines, label) in enumerate(SHOTS, 1):
        p = os.path.join(raw_dir, f)
        if os.path.exists(p):
            screenshot(p, bg, lines, label, f'store/screenshot-{i}.png')
            n += 1
    print(f'store/: icon, feature graphic, {n} screenshots')
