# Renders Pingo's logo into the app's icon/splash assets. Run from the repo root:
#   python3 scripts/make_icons.py
# Mark: ink rounded square, lime "P", pink "ping" dot on the top-right corner.
from PIL import Image, ImageDraw, ImageFont

FONT = 'node_modules/@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf'
LIME, INK, PINK = (198, 244, 50, 255), (20, 20, 20, 255), (255, 122, 198, 255)


def mark(size, box_frac, bg=None, dot=True, ink=INK, letter=LIME, dot_fill=PINK):
    im = Image.new('RGBA', (size, size), bg or (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    b = size * box_frac
    x0 = (size - b) / 2
    d.rounded_rectangle([x0, x0, x0 + b, x0 + b], radius=b * 0.25, fill=ink)
    f = ImageFont.truetype(FONT, int(b * 0.72))
    d.text((size / 2 - b * 0.02, size / 2 + b * 0.02), 'P', font=f, fill=letter, anchor='mm')
    if dot:
        r = b * 0.17
        cx, cy = x0 + b - r * 0.55, x0 + r * 0.55
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=dot_fill, outline=ink, width=max(2, int(b * 0.035)))
    return im


mark(1024, 0.56, LIME).convert('RGB').save('assets/icon.png')                     # iOS: no transparency
mark(1024, 0.42).save('assets/android-icon-foreground.png')                       # inside adaptive safe zone
Image.new('RGBA', (1024, 1024), LIME).save('assets/android-icon-background.png')
white = (255, 255, 255, 255)
mark(1024, 0.42, ink=white, letter=(0, 0, 0, 0), dot_fill=white).save('assets/android-icon-monochrome.png')
mark(512, 0.86).save('assets/splash-icon.png')
mark(48, 0.9, LIME, dot=False).save('assets/favicon.png')                         # too small for the dot
print('icons written')
