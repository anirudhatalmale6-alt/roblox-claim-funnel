"""
Facebook creatives for the Roblox claim funnel.

Deliberately text-only. Meta's personal-attributes policy is the usual reason
these ads get killed, and stock photos of distressed children would fail the
sensitive-content rules on top of that. Type on a flat colour reads as an
information notice rather than an accusation, which is exactly the register
that gets approved.
"""
from PIL import Image, ImageDraw, ImageFont

NAVY   = (22, 38, 63)
NAVY2  = (30, 51, 85)
TEAL   = (21, 154, 160)
TEAL_D = (18, 123, 127)
CREAM  = (246, 248, 251)
WHITE  = (255, 255, 255)
MUTED  = (150, 168, 188)
INK    = (29, 39, 51)
GREY   = (92, 107, 125)

B = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
R = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"


def f(path, size):
    return ImageFont.truetype(path, size)


def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def block(draw, text, font, x, y, max_w, fill, lh=1.22, center=False, cw=None):
    lines = wrap(draw, text, font, max_w)
    step = int(font.size * lh)
    for ln in lines:
        px = x + (cw - draw.textlength(ln, font=font)) / 2 if center else x
        draw.text((px, y), ln, font=font, fill=fill)
        y += step
    return y


def pill(draw, x, y, text, font, bg, fg, padx=22, pady=11, radius=99):
    w = draw.textlength(text, font=font) + padx * 2
    h = font.size + pady * 2
    draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=bg)
    draw.text((x + padx, y + pady - 2), text, font=font, fill=fg)
    return y + h


def logo(draw, x, y, mark_size=52, on_dark=True):
    draw.rounded_rectangle([x, y, x + mark_size, y + mark_size], radius=14,
                           fill=WHITE if on_dark else NAVY)
    fm = f(B, 17)
    draw.text((x + (mark_size - draw.textlength("RCA", font=fm)) / 2, y + mark_size / 2 - 10),
              "RCA", font=fm, fill=NAVY if on_dark else WHITE)
    fb_ = f(B, 25)
    tx = x + mark_size + 14
    draw.text((tx, y + 5), "Roblox Claim", font=fb_, fill=WHITE if on_dark else NAVY)
    w1 = draw.textlength("Roblox Claim ", font=fb_)
    draw.text((tx + w1, y + 5), "Advocate", font=fb_, fill=TEAL)


def footer_note(draw, W, H, on_dark=True):
    fn = f(R, 19)
    txt = "Attorney Advertising · Not affiliated with Roblox Corporation"
    draw.text(((W - draw.textlength(txt, font=fn)) / 2, H - 52), txt,
              font=fn, fill=MUTED if on_dark else GREY)


# ---------------------------------------------------------------- 1. navy
def ad_navy(path, W=1080, H=1080):
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    for i in range(H):                       # soft vertical gradient
        t = i / H
        d.line([(0, i), (W, i)],
               fill=(int(NAVY[0] + (NAVY2[0] - NAVY[0]) * t),
                     int(NAVY[1] + (NAVY2[1] - NAVY[1]) * t),
                     int(NAVY[2] + (NAVY2[2] - NAVY[2]) * t)))
    d.rectangle([0, 0, W, 8], fill=TEAL)
    logo(d, 84, 78)

    y = 300
    pill(d, 84, y, "LAWSUITS NOW BEING FILED", f(B, 24), TEAL_D, WHITE)
    y += 104
    y = block(d, "Families are taking legal action against Roblox.",
              f(B, 74), 84, y, W - 168, WHITE, lh=1.16)
    y += 34
    y = block(d, "Claims allege the platform failed to protect children from "
                 "predators who contacted them through the game.",
              f(R, 34), 84, y, W - 200, (196, 212, 228), lh=1.36)
    y += 62
    pill(d, 84, y, "See if your family qualifies  →", f(B, 33), TEAL, WHITE, padx=34, pady=19)
    footer_note(d, W, H)
    img.save(path, quality=94)
    return path


# ---------------------------------------------------------------- 2. light
def ad_light(path, W=1080, H=1080):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 150], fill=NAVY)
    logo(d, 84, 49)
    d.rectangle([0, 150, W, 158], fill=TEAL)

    y = 258
    pill(d, 84, y, "FREE CASE REVIEW", f(B, 24), (214, 238, 238), TEAL_D)
    y += 92
    y = block(d, "Roblox Lawsuit Information Center",
              f(B, 70), 84, y, W - 168, NAVY, lh=1.15)
    y += 30
    y = block(d, "Parents and guardians can find out in a few minutes whether "
                 "their family may be eligible to file a claim.",
              f(R, 34), 84, y, W - 190, GREY, lh=1.36)
    y += 40

    for line in ["No cost and no obligation",
                 "Private and confidential",
                 "Takes about three minutes"]:
        d.ellipse([88, y + 8, 112, y + 32], fill=TEAL)
        d.line([94, y + 20, 100, y + 26], fill=WHITE, width=4)
        d.line([100, y + 26, 107, y + 14], fill=WHITE, width=4)
        d.text((130, y + 2), line, font=f(B, 31), fill=INK)
        y += 58

    y += 26
    pill(d, 84, y, "Start the free case review  →", f(B, 33), TEAL_D, WHITE, padx=34, pady=19)
    footer_note(d, W, H, on_dark=False)
    img.save(path, quality=94)
    return path


# ---------------------------------------------------------------- 3. vertical
def ad_vertical(path, W=1080, H=1350):
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    for i in range(H):
        t = i / H
        d.line([(0, i), (W, i)],
               fill=(int(NAVY[0] + (NAVY2[0] - NAVY[0]) * t),
                     int(NAVY[1] + (NAVY2[1] - NAVY[1]) * t),
                     int(NAVY[2] + (NAVY2[2] - NAVY[2]) * t)))
    d.rectangle([0, 0, W, 10], fill=TEAL)
    logo(d, 84, 96, mark_size=58)

    y = 300
    pill(d, 84, y, "NATIONWIDE LITIGATION", f(B, 26), TEAL_D, WHITE)
    y += 106
    y = block(d, "Roblox is facing lawsuits from families across the country.",
              f(B, 80), 84, y, W - 168, WHITE, lh=1.16)
    y += 40
    y = block(d, "The claims allege Roblox did not do enough to keep predators "
                 "away from the children using its platform.",
              f(R, 36), 84, y, W - 190, (196, 212, 228), lh=1.36)

    y += 60
    d.rounded_rectangle([84, y, W - 84, y + 250], radius=26, fill=(255, 255, 255, 255))
    d.text((124, y + 34), "A free review will tell you:", font=f(B, 32), fill=NAVY)
    yy = y + 92
    for line in ["Whether your family may be eligible",
                 "What records matter most",
                 "What the next step would be"]:
        d.ellipse([126, yy + 6, 148, yy + 28], fill=TEAL)
        d.text((168, yy), line, font=f(R, 30), fill=INK)
        yy += 50

    y += 300
    pill(d, 84, y, "Check eligibility  →", f(B, 35), TEAL, WHITE, padx=38, pady=21)
    footer_note(d, W, H)
    img.save(path, quality=94)
    return path


if __name__ == "__main__":
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    for fn, name in [(ad_navy, "ad_navy.jpg"),
                     (ad_light, "ad_light.jpg"),
                     (ad_vertical, "ad_vertical.jpg")]:
        p = fn(os.path.join(here, name))
        print("wrote", p, Image.open(p).size)
