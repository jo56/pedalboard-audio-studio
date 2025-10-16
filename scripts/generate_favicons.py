#!/usr/bin/env python3
"""Generate favicon assets so every format matches the current SVG design.

This script recreates all icon variants (ICO + PNG sizes) using Pillow so the
artwork stays consistent across desktop and mobile platforms.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw


REPO_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = REPO_ROOT / "frontend" / "public"
DIST_DIR = REPO_ROOT / "frontend" / "dist"

# Design constants extracted from frontend/public/favicon.svg
BASE_VIEWBOX = 64
SCALE_FACTOR = 16  # Render at 16x for crisp downscaling
BASE_SIZE = BASE_VIEWBOX * SCALE_FACTOR
RADIUS = 14 * SCALE_FACTOR

# Colors (RGBA)
BACKGROUND = (245, 245, 244, 255)  # #f5f5f4
SPEAKER_FILL = (120, 113, 108, 255)  # #78716c
WAVE_FILL = (180, 83, 9, int(round(0.9 * 255)))  # #b45309, 90% opacity
INNER_WAVE_STROKE = (120, 113, 108, 255)  # #78716c
OUTER_WAVE_STROKE = (180, 83, 9, int(round(0.85 * 255)))  # #b45309, 85% opacity

STROKE_WIDTH = int(round(3 * SCALE_FACTOR))


def scaled_point(point: tuple[float, float]) -> tuple[float, float]:
    """Scale a point from the 64px viewbox to the rendering resolution."""
    return point[0] * SCALE_FACTOR, point[1] * SCALE_FACTOR


def cubic_bezier_points(
    p0: tuple[float, float],
    p1: tuple[float, float],
    p2: tuple[float, float],
    p3: tuple[float, float],
    steps: int = 64,
) -> list[tuple[float, float]]:
    """Sample a cubic Bézier curve returning evenly spaced points."""
    points: list[tuple[float, float]] = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = (
            u**3 * p0[0]
            + 3 * u**2 * t * p1[0]
            + 3 * u * t**2 * p2[0]
            + t**3 * p3[0]
        )
        y = (
            u**3 * p0[1]
            + 3 * u**2 * t * p1[1]
            + 3 * u * t**2 * p2[1]
            + t**3 * p3[1]
        )
        points.append((x, y))
    return points


def draw_round_caps(draw: ImageDraw.ImageDraw, point: tuple[float, float], radius: float, fill: tuple[int, int, int, int]) -> None:
    """Add a filled circle to mimic a round line cap."""
    x, y = point
    bbox = (x - radius, y - radius, x + radius, y + radius)
    draw.ellipse(bbox, fill=fill)


def render_master_icon() -> Image.Image:
    """Render the high-resolution master icon."""
    base = Image.new("RGBA", (BASE_SIZE, BASE_SIZE), (0, 0, 0, 0))

    # Background with rounded corners
    background = Image.new("RGBA", (BASE_SIZE, BASE_SIZE), BACKGROUND)
    mask = Image.new("L", (BASE_SIZE, BASE_SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, BASE_SIZE, BASE_SIZE), radius=RADIUS, fill=255
    )
    background.putalpha(mask)
    base.alpha_composite(background)

    draw = ImageDraw.Draw(base, "RGBA")

    # Speaker enclosure polygon
    speaker_points = [
        scaled_point((18, 24)),
        scaled_point((28, 24)),
        scaled_point((36, 18)),
        scaled_point((36, 46)),
        scaled_point((28, 40)),
        scaled_point((18, 40)),
    ]
    draw.polygon(speaker_points, fill=SPEAKER_FILL)

    # Inner wave polygon
    wave_points = [
        scaled_point((28, 24)),
        scaled_point((36, 30)),
        scaled_point((36, 34)),
        scaled_point((28, 40)),
    ]
    draw.polygon(wave_points, fill=WAVE_FILL)

    # Audio waves (sampled Bézier curves)
    width = max(STROKE_WIDTH, 1)
    radius = width / 2

    inner_curve = cubic_bezier_points(
        scaled_point((42, 23)),
        scaled_point((46, 27.5)),
        scaled_point((46, 34.5)),
        scaled_point((42, 39)),
    )
    draw.line(inner_curve, fill=INNER_WAVE_STROKE, width=width)
    draw_round_caps(draw, inner_curve[0], radius, INNER_WAVE_STROKE)
    draw_round_caps(draw, inner_curve[-1], radius, INNER_WAVE_STROKE)

    outer_curve = cubic_bezier_points(
        scaled_point((47, 19)),
        scaled_point((53, 25.8)),
        scaled_point((53, 36.2)),
        scaled_point((47, 43)),
    )
    draw.line(outer_curve, fill=OUTER_WAVE_STROKE, width=width)
    draw_round_caps(draw, outer_curve[0], radius, OUTER_WAVE_STROKE)
    draw_round_caps(draw, outer_curve[-1], radius, OUTER_WAVE_STROKE)

    return base


def export_png(image: Image.Image, size: int, path: Path) -> None:
    """Resize the master image and save out a PNG."""
    resized = image.resize((size, size), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    resized.save(path, format="PNG")


def export_ico(image: Image.Image, path: Path) -> None:
    """Save a multi-size ICO for browser compatibility."""
    ico_sizes = [16, 32, 48, 64, 128, 256]
    largest = max(ico_sizes)
    base = image.resize((largest, largest), Image.LANCZOS)
    size_pairs = [(size, size) for size in ico_sizes]
    path.parent.mkdir(parents=True, exist_ok=True)
    base.save(path, format="ICO", sizes=size_pairs)


def main() -> None:
    master = render_master_icon()

    targets = [
        (192, PUBLIC_DIR / "icon-192.png"),
        (512, PUBLIC_DIR / "icon-512.png"),
        (180, PUBLIC_DIR / "apple-touch-icon.png"),
        (192, DIST_DIR / "icon-192.png"),
        (512, DIST_DIR / "icon-512.png"),
        (180, DIST_DIR / "apple-touch-icon.png"),
    ]

    for size, path in targets:
        export_png(master, size, path)

    export_ico(master, PUBLIC_DIR / "favicon.ico")
    export_ico(master, DIST_DIR / "favicon.ico")


if __name__ == "__main__":
    main()
