"""
OG card renderer — generates shareable sealed-scroll PNG cards for bonds.

Uses Pillow to render a 1200x630 image (standard OG card size) with the
Pledgebond aesthetic: parchment background, wax seal, Cormorant Garamond
serif typography, gold accents.

The card is designed to be screenshot-worthy when shared on social media —
it shows the bond title, cause, stakes, participant count, and a wax seal
that matches the bond's seal_style.
"""
import os
import math
from pathlib import Path
from typing import Optional
import logging

from PIL import Image, ImageDraw, ImageFont, ImageFilter

logger = logging.getLogger(__name__)

ASSETS_DIR = Path(__file__).parent / "assets"
CARD_W, CARD_H = 1200, 630

# Seal style palettes — mirrors VaultSeal.jsx STYLE_PALETTES
SEAL_PALETTES = {
    "burgundy": {
        "wax_light": "#B83A57",
        "wax_mid": "#9A1F3D",
        "wax_dark": "#651427",
        "wax_darker": "#4A0F1E",
        "gold": "#C49A3A",
        "gold_light": "#E0C06A",
    },
    "gold": {
        "wax_light": "#E0C06A",
        "wax_mid": "#C49A3A",
        "wax_dark": "#8E6A1F",
        "wax_darker": "#7A5A1A",
        "gold": "#8E6A1F",
        "gold_light": "#F2E2A6",
    },
    "emerald": {
        "wax_light": "#2E8B67",
        "wax_mid": "#1F6B4E",
        "wax_dark": "#134E38",
        "wax_darker": "#0D3826",
        "gold": "#C49A3A",
        "gold_light": "#E0C06A",
    },
}

# Parchment colors
PARCHMENT_BG = (255, 251, 242)
PARCHMENT_DARK = (242, 230, 209)
INK = (28, 25, 28)
INK_600 = (74, 68, 64)
INK_500 = (107, 99, 92)
WAX_GOLD = (196, 154, 58)

_font_cache = {}


def _font(name: str, size: int) -> ImageFont.FreeTypeFont:
    """Load a font from the assets directory with caching."""
    key = (name, size)
    if key in _font_cache:
        return _font_cache[key]
    path = ASSETS_DIR / name
    try:
        font = ImageFont.truetype(str(path), size)
    except Exception:
        logger.warning("Could not load font %s, falling back to default", name)
        font = ImageFont.load_default()
    _font_cache[key] = font
    return font


def _hex_to_rgb(hex_color: str) -> tuple:
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _draw_parchment_bg(img: ImageDraw.ImageDraw):
    """Draw the parchment background with subtle gradient + noise texture."""
    # Base fill
    for y in range(CARD_H):
        # Subtle vertical gradient: lighter at top, slightly darker at bottom
        ratio = y / CARD_H
        r = int(PARCHMENT_BG[0] * (1 - ratio * 0.05) + PARCHMENT_DARK[0] * ratio * 0.05)
        g = int(PARCHMENT_BG[1] * (1 - ratio * 0.05) + PARCHMENT_DARK[1] * ratio * 0.05)
        b = int(PARCHMENT_BG[2] * (1 - ratio * 0.05) + PARCHMENT_DARK[2] * ratio * 0.05)
        img.line([(0, y), (CARD_W, y)], fill=(r, g, b))


def _draw_ornate_border(draw: ImageDraw.ImageDraw):
    """Draw an ornate gold border frame."""
    margin = 24
    # Outer thin gold line
    draw.rectangle(
        [margin, margin, CARD_W - margin, CARD_H - margin],
        outline=WAX_GOLD, width=2,
    )
    # Inner thin gold line
    draw.rectangle(
        [margin + 8, margin + 8, CARD_W - margin - 8, CARD_H - margin - 8],
        outline=WAX_GOLD, width=1,
    )
    # Corner ornaments — small gold circles
    for cx, cy in [(margin, margin), (CARD_W - margin, margin),
                   (margin, CARD_H - margin), (CARD_W - margin, CARD_H - margin)]:
        draw.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=WAX_GOLD)


def _draw_wax_seal(draw: ImageDraw.ImageDraw, cx: int, cy: int, radius: int, style: str):
    """Draw a wax seal — a circular wax disc with a gold ring and 'P' monogram."""
    palette = SEAL_PALETTES.get(style, SEAL_PALETTES["burgundy"])
    wax_mid = _hex_to_rgb(palette["wax_mid"])
    wax_dark = _hex_to_rgb(palette["wax_dark"])
    wax_darker = _hex_to_rgb(palette["wax_darker"])
    gold = _hex_to_rgb(palette["gold"])
    gold_light = _hex_to_rgb(palette["gold_light"])

    # Shadow
    shadow_offset = 6
    draw.ellipse(
        [cx - radius + shadow_offset, cy - radius + shadow_offset,
         cx + radius + shadow_offset, cy + radius + shadow_offset],
        fill=(0, 0, 0, 80),
    )

    # Outer wax disc (darker rim)
    draw.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        fill=wax_darker,
    )

    # Inner wax disc (main color) — slightly smaller for a rim effect
    inner_r = int(radius * 0.92)
    draw.ellipse(
        [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
        fill=wax_mid,
    )

    # Highlight — lighter wax at top-left
    highlight_r = int(radius * 0.55)
    draw.ellipse(
        [cx - highlight_r - int(radius * 0.15), cy - highlight_r - int(radius * 0.15),
         cx + highlight_r - int(radius * 0.25), cy + highlight_r - int(radius * 0.25)],
        fill=_hex_to_rgb(palette["wax_light"]),
    )
    # Re-overlay main color with transparency for subtle highlight
    # (Pillow doesn't do alpha easily on Draw, so we use a separate layer)
    overlay = Image.new("RGBA", (radius * 2, radius * 2), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([0, 0, radius * 2, radius * 2], fill=wax_mid + (180,))
    # This is a simplification — the radial gradient look comes from the layered ellipses above

    # Gold ring
    ring_r = int(radius * 0.75)
    draw.ellipse(
        [cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
        outline=gold, width=4,
    )
    # Inner gold ring
    ring_r2 = int(radius * 0.68)
    draw.ellipse(
        [cx - ring_r2, cy - ring_r2, cx + ring_r2, cy + ring_r2],
        outline=gold_light, width=1,
    )

    # 'P' monogram in gold
    try:
        mono_font = _font("CormorantGaramond-Bold.ttf", int(radius * 0.9))
        text = "P"
        bbox = draw.textbbox((0, 0), text, font=mono_font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = cx - tw / 2 - bbox[0]
        ty = cy - th / 2 - bbox[1] - int(radius * 0.05)
        draw.text((tx, ty), text, font=mono_font, fill=gold_light)
    except Exception:
        pass


def _draw_text_wrapped(draw, text, font, max_width, line_height, start_x, start_y, fill):
    """Wrap text to fit within max_width and draw it."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = (current + " " + word).strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)

    y = start_y
    for line in lines:
        draw.text((start_x, y), line, font=font, fill=fill)
        y += line_height
    return y


def render_bond_card(bond: dict) -> bytes:
    """Render an OG card PNG for a bond. Returns PNG bytes."""
    img = Image.new("RGB", (CARD_W, CARD_H), PARCHMENT_BG)
    draw = ImageDraw.Draw(img)

    # Background
    _draw_parchment_bg(draw)

    # Ornate border
    _draw_ornate_border(draw)

    # Layout: seal on the left, text on the right
    seal_cx = 200
    seal_cy = 315
    seal_radius = 130

    seal_style = bond.get("seal_style", "burgundy")
    _draw_wax_seal(draw, seal_cx, seal_cy, seal_radius, seal_style)

    # Text area: x from 380 to 1160
    text_x = 380
    text_max_w = 780

    # Top label — "PLEDGEBOND" in gold tracking, or "HERE WE GO" for football bonds
    label_font = _font("DMSans-Medium.ttf", 16)
    category = bond.get("category", "")
    if category == "football":
        draw.text((text_x, 60), "H E R E   W E   G O   \u26bd   P L E D G E B O N D", font=label_font, fill=WAX_GOLD)
    else:
        draw.text((text_x, 60), "P L E D G E B O N D", font=label_font, fill=WAX_GOLD)

    # Sub-label — "A pledge is a sealed contract"
    sub_font = _font("CormorantGaramond-SemiBold.ttf", 18)
    draw.text((text_x, 88), "A pledge is a sealed contract", font=sub_font, fill=INK_500)

    # Divider
    draw.line([(text_x, 122), (text_x + 120, 122)], fill=WAX_GOLD, width=2)

    # Bond title — large serif, wrapped
    title_font = _font("CormorantGaramond-Bold.ttf", 52)
    title = bond.get("title", "Untitled Bond")
    title_y = _draw_text_wrapped(draw, title, title_font, text_max_w, 58, text_x, 145, INK)

    # Description — smaller serif, wrapped, 2 lines max
    desc_font = _font("CormorantGaramond-SemiBold.ttf", 22)
    desc = bond.get("description", "")
    if desc:
        # Truncate to ~140 chars for the card
        if len(desc) > 140:
            desc = desc[:137] + "..."
        desc_y = title_y + 12
        desc_end = _draw_text_wrapped(draw, desc, desc_font, text_max_w, 28, text_x, desc_y, INK_600)
    else:
        desc_end = title_y

    # Stats row — at stake, witnesses, deadline
    stats_y = max(desc_end + 20, 460)
    stat_font_label = _font("DMSans-Medium.ttf", 12)
    stat_font_value = _font("CormorantGaramond-Bold.ttf", 28)

    funder_amount = bond.get("funder_amount", 0)
    participant_count = len(bond.get("participants", []))
    witness_count = len(bond.get("witnesses", []))

    # Three stat columns
    col_w = text_max_w // 3
    stats = [
        ("AT STAKE", f"${int(funder_amount):,}"),
        ("PLEDGED", f"{participant_count} fundees"),
        ("WITNESSING", f"{witness_count} watchers"),
    ]
    for i, (label, value) in enumerate(stats):
        sx = text_x + i * col_w
        draw.text((sx, stats_y), label, font=stat_font_label, fill=INK_500)
        draw.text((sx, stats_y + 18), value, font=stat_font_value, fill=INK)

    # Cause name at bottom
    cause = bond.get("cause_name", "")
    if cause:
        cause_font = _font("CormorantGaramond-SemiBold.ttf", 20)
        cause_y = CARD_H - 70
        draw.text((text_x, cause_y), f"In benefit of — {cause}", font=cause_font, fill=INK_600)

    # Bottom-right tagline — use FRONTEND_URL if available
    tag_font = _font("DMSans-Regular.ttf", 13)
    frontend_url = os.environ.get("FRONTEND_URL", "pledgebond.app")
    # Strip protocol for display
    tag = frontend_url.replace("https://", "").replace("http://", "").rstrip("/")
    bbox = draw.textbbox((0, 0), tag, font=tag_font)
    tw = bbox[2] - bbox[0]
    draw.text((CARD_W - 48 - tw, CARD_H - 48), tag, font=tag_font, fill=INK_500)

    # Convert to PNG bytes
    import io
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()
