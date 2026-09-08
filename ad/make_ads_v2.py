"""
Round two creatives, after round one returned 40 clicks from 29,390 impressions
(0.13% CTR) over five days and Meta throttled delivery to near zero.

The diagnosis: round one was written as a news headline — "Roblox is facing
lawsuits from families across the country." It informs, but it never asks the
reader anything, so a parent whose child this actually happened to has no moment
of recognition. Broad audience plus general copy means everyone sees it and
nobody feels addressed.

Round two swaps general framing for specific, recognisable detail — the way the
contact actually happened, the objection that stops people acting, and a plain
list of what counts. The aim is that the wrong reader scrolls past faster and
the right reader stops dead.

Policy note, and the reason none of these are phrased as a direct question about
the reader: Meta's personal-attributes rules prohibit copy that asserts or
implies you know something private about the person seeing it. "Did your child
get groomed on Roblox?" is exactly the shape that gets an account restricted.
Every headline below is therefore conditional ("if this happened", "families
who...") or about the litigation, never about the reader. Same recognition,
without the assertion.
"""
import os
from PIL import Image, ImageDraw
from make_ads import (NAVY, NAVY2, TEAL, TEAL_D, CREAM, WHITE, MUTED, INK, GREY,
                      B, R, f, block, pill, logo, footer_note)


def cta(d, W, H, text, bg=TEAL, size=33):
    """Draw the call to action at a fixed distance above the footer note.

    Round one of this file flowed the CTA down the page after the copy, which
    meant longer headlines pushed it into the disclaimer line or clean off the
    bottom edge. The button and the legal note are the two things that must
    always be visible, so both are now anchored to the bottom and the copy has
    to fit in what is left."""
    return pill(d, 84, H - 200, text, f(B, size), bg, WHITE, padx=34, pady=19)


def gradient(d, W, H):
    for i in range(H):
        t = i / H
        d.line([(0, i), (W, i)],
               fill=(int(NAVY[0] + (NAVY2[0] - NAVY[0]) * t),
                     int(NAVY[1] + (NAVY2[1] - NAVY[1]) * t),
                     int(NAVY[2] + (NAVY2[2] - NAVY[2]) * t)))


def ticks(d, lines, x, y, font, fill, gap=58, dot=TEAL):
    for line in lines:
        d.ellipse([x, y + 6, x + 24, y + 30], fill=dot)
        d.line([x + 6, y + 18, x + 12, y + 24], fill=WHITE, width=4)
        d.line([x + 12, y + 24, x + 19, y + 12], fill=WHITE, width=4)
        d.text((x + 42, y), line, font=font, fill=fill)
        y += gap
    return y


# --------------------------------------------------------- A. how it started
def ad_howitstarted(path, W=1080, H=1080):
    """The specific mechanic. A parent who lived this recognises it instantly;
    everyone else reads it as a news line and scrolls on. That asymmetry is
    the whole point — we are not trying to interest 29,000 people."""
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    gradient(d, W, H)
    d.rectangle([0, 0, W, 8], fill=TEAL)
    logo(d, 84, 78)

    y = 246
    pill(d, 84, y, "ROBLOX LITIGATION", f(B, 24), TEAL_D, WHITE)
    y += 92
    y = block(d, "It often began in the game — and moved to Discord or Snapchat.",
              f(B, 62), 84, y, W - 168, WHITE, lh=1.17)
    y += 26
    y = block(d, "Lawsuits allege adults used Roblox to reach children, then moved "
                 "the conversation somewhere parents could not see it.",
              f(R, 31), 84, y, W - 200, (196, 212, 228), lh=1.36)
    y += 34
    y = block(d, "If that happened in your family, a free review can tell you "
                 "whether a claim may be available.",
              f(B, 31), 84, y, W - 200, WHITE, lh=1.34)
    cta(d, W, H, "Check eligibility  →")
    footer_note(d, W, H)
    img.save(path, quality=94)
    return path


# --------------------------------------------------------- B. the objection
def ad_neverreported(path, W=1080, H=1080):
    """Kills the reason people who DO qualify still don't act: they assume that
    because they never reported it, never kept anything, and the account is
    long gone, there is nothing to be done. Answering that objection in the ad
    is usually worth more than any amount of urgency language."""
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 150], fill=NAVY)
    logo(d, 84, 49)
    d.rectangle([0, 150, W, 158], fill=TEAL)

    y = 232
    pill(d, 84, y, "FREE CASE REVIEW", f(B, 24), (214, 238, 238), TEAL_D)
    y += 88
    y = block(d, "Most families never reported it. That doesn't close the door.",
              f(B, 58), 84, y, W - 168, NAVY, lh=1.16)
    y += 24
    y = block(d, "Claims are still being reviewed where nothing was reported at the "
                 "time, the messages are long gone, and the account no longer exists.",
              f(R, 29), 84, y, W - 190, GREY, lh=1.36)
    y += 30
    y = ticks(d, ["No police report needed to ask",
                  "No cost and no obligation",
                  "Private — takes about three minutes"],
              88, y, f(B, 29), INK, gap=52)
    cta(d, W, H, "See where you stand  →", bg=TEAL_D)
    footer_note(d, W, H, on_dark=False)
    img.save(path, quality=94)
    return path


# --------------------------------------------------------- C. what counts
def ad_whatcounts(path, W=1080, H=1080):
    """Plain list. Lets the reader self-assess in about four seconds without
    clicking, which sounds like it costs clicks and does the opposite — the
    clicks you lose were never going to complete a 14-question intake."""
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    gradient(d, W, H)
    d.rectangle([0, 0, W, 8], fill=TEAL)
    logo(d, 84, 78)

    y = 232
    pill(d, 84, y, "WHAT MAY COUNT", f(B, 24), TEAL_D, WHITE)
    y += 92
    y = block(d, "Any of this sound familiar?", f(B, 62), 84, y, W - 168, WHITE, lh=1.16)
    y += 26

    card_top = y
    card_h = 40 + 4 * 56
    d.rounded_rectangle([84, card_top, W - 84, card_top + card_h], radius=26, fill=WHITE)
    ticks(d, ["An adult made contact through the game",
              "The chat moved to Discord, Snapchat or text",
              "Robux, gift cards or money were sent",
              "Photos or video were requested"],
          126, card_top + 34, f(R, 28), INK, gap=56)

    y = card_top + card_h + 30
    y = block(d, "If you recognise any of it, a free and confidential review will "
                 "tell you whether a claim may be available.",
              f(R, 29), 84, y, W - 200, (196, 212, 228), lh=1.36)
    cta(d, W, H, "Start the free review  →")
    footer_note(d, W, H)
    img.save(path, quality=94)
    return path


# --------------------------------------------------------- vertical companion
def ad_howitstarted_v(path, W=1080, H=1350):
    """Reels and Story need the 4:5 / 9:16 shape or Meta crops the headline.
    Round one only had a square on all four placements."""
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    gradient(d, W, H)
    d.rectangle([0, 0, W, 10], fill=TEAL)
    logo(d, 84, 96, mark_size=58)

    y = 330
    pill(d, 84, y, "ROBLOX LITIGATION", f(B, 26), TEAL_D, WHITE)
    y += 108
    y = block(d, "It often began in the game — and moved to Discord or Snapchat.",
              f(B, 78), 84, y, W - 168, WHITE, lh=1.16)
    y += 40
    y = block(d, "Lawsuits allege adults used Roblox to reach children, then moved "
                 "the conversation somewhere parents could not see.",
              f(R, 35), 84, y, W - 190, (196, 212, 228), lh=1.36)
    y += 56
    y = block(d, "If that happened in your family, a free review can tell you "
                 "whether a claim may be available.",
              f(B, 35), 84, y, W - 190, WHITE, lh=1.34)
    cta(d, W, H, "Check eligibility  →", size=35)
    footer_note(d, W, H)
    img.save(path, quality=94)
    return path


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    for fn, name in [(ad_howitstarted,   "v2_a_howitstarted.jpg"),
                     (ad_neverreported,  "v2_b_neverreported.jpg"),
                     (ad_whatcounts,     "v2_c_whatcounts.jpg"),
                     (ad_howitstarted_v, "v2_a_vertical.jpg")]:
        p = fn(os.path.join(here, name))
        print("wrote", os.path.basename(p), Image.open(p).size)
