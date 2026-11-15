"""Generate the first-round logo concepts as clean SVGs (black on white, 256 x 256).

Run:  py -3 design/logo/src/make_concepts.py   (writes into design/logo/round1/)

Every concept is a play button that turns out to be built from something rooted in Islamic learning:
  A  Nuqat    three calligraphic dots (the dots of ش / ث), turned to point forward
  B  Riwaq    an arcade receding in perspective; its outline narrows to a play point
  C  Darajat  steps (minbar, "degrees" of 58:11) climbing to a play point
"""

from __future__ import annotations

import math
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "round1"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#161616"
CX, CY = 128.0, 128.0
SQ3 = math.sqrt(3)


def f(n: float) -> str:
    """Format a coordinate with at most 2 decimals and no trailing zeros."""
    s = f"{n:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def poly(points) -> str:
    return "M" + " L".join(f"{f(x)} {f(y)}" for x, y in points) + " Z"


def svg(title: str, d: str, evenodd: bool = False) -> str:
    rule = ' fill-rule="evenodd"' if evenodd else ""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" '
        f'role="img" aria-labelledby="title">\n  <title id="title">{title}</title>\n'
        f'  <path fill="{INK}"{rule} d="{d}"/>\n</svg>\n'
    )


def write(name: str, title: str, d: str, evenodd: bool = False) -> None:
    (OUT / f"{name}.svg").write_text(svg(title, d, evenodd), encoding="utf-8")
    print("wrote", name)


# ---------------------------------------------------------------- shared play envelope
# Equilateral triangle pointing right: height 184 (y 36..220), width 92*sqrt(3) = 159.35.
# Shifted right of centre so the visual mass (centroid) sits nearer the middle of the canvas.
HALF = 92.0
W = HALF * SQ3
LEFT = 56.0
TIP = LEFT + W


def half_height(x: float) -> float:
    return HALF * (TIP - x) / W


# ---------------------------------------------------------------- A: Nuqat
def nuqta(cx: float, cy: float, a: float, theta_deg: float):
    """Square of half-side a rotated by theta (SVG coordinates, clockwise)."""
    t = math.radians(theta_deg)
    c, s = math.cos(t), math.sin(t)
    pts = []
    for x, y in ((a, a), (a, -a), (-a, -a), (-a, a)):
        pts.append((cx + x * c - y * s, cy + x * s + y * c))
    return pts


def rhombus(cx: float, cy: float, rx: float, ry: float):
    """Rhombus with vertices left/top/right/bottom (half diagonals rx, ry)."""
    return [(cx, cy - ry), (cx + rx, cy), (cx, cy + ry), (cx - rx, cy)]


def concept_a(variant: str, d_centres: float = 112.0, a: float = 30.5, name: str | None = None) -> None:
    """Three dots on an equilateral triangle; d_centres = distance between dot centres."""
    col = 128.0 - d_centres * SQ3 / 2 / 2 + 6  # left column x; +6 = optical shift right
    centres = [(col, CY - d_centres / 2), (col, CY + d_centres / 2), (col + d_centres * SQ3 / 2, CY)]
    if variant == "diamond":
        dots = [rhombus(x, y, 42, 42) for x, y in centres]
    elif variant == "lean":
        dots = [nuqta(x, y, a, 60) for x, y in centres]
    elif variant == "edge":
        # sides parallel to the play triangle's edges (60/120 degree rhombus, wider than tall)
        dots = [rhombus(x, y, 46, 46 / SQ3 * 1.0 + 0.0) for x, y in centres]
    else:  # tall calligraphic rhombus: taller than wide, like a pen-made dot
        dots = [rhombus(x, y, 36, 46) for x, y in centres]
    write(name or f"a-nuqat-{variant}", "Nuqat — three dots pointing forward", " ".join(poly(p) for p in dots))


# ---------------------------------------------------------------- B: Riwaq
def riwaq(c: float = 0.6, pier: float = 0.3, v_floor: float = 0.7, v_apex: float = -0.52, bays: int = 3,
          name: str = "b-riwaq") -> None:
    """Solid play triangle = the wall of an arcade seen in perspective; the arches are holes.

    Frontal wall coordinates: u along the wall (bay width 1), v from -1 (roof line) to +1 (floor line).
    A homography maps (u, v) to the canvas so the wall converges to the play tip.
    """

    def m(u: float, v: float):
        k = 1.0 / (1.0 + c * u)
        return (TIP - W * k, CY + HALF * v * k)

    def arch(u0: float, u1: float) -> str:
        span = u1 - u0
        # frontal pixels per unit at u=0: W*c horizontally, HALF vertically -> keep the arch round there
        sx, sy = W * c, HALF
        r = span  # equilateral pointed arch: radius = span
        rise = span * SQ3 / 2  # apex height above springing, in u-units
        v_spring = v_apex + rise * sx / sy
        k = 4 / 3 * math.tan(math.radians(60) / 4) * r  # 60 degree arc as one cubic
        um = (u0 + u1) / 2
        # left arc: centre (u1, spring), from angle 180 (u0) to 120 (apex)
        p0 = (u0, v_spring)
        p3 = (um, v_apex)
        # tangent at start is straight up; at apex it leans 30 deg
        c1 = (u0, v_spring - k * sx / sy)
        c2 = (um - k * math.cos(math.radians(30)), v_apex + k * math.sin(math.radians(30)) * sx / sy)
        q1 = (um + k * math.cos(math.radians(30)), v_apex + k * math.sin(math.radians(30)) * sx / sy)
        q2 = (u1, v_spring - k * sx / sy)
        q3 = (u1, v_spring)
        pts = [m(u0, v_floor), m(*p0)]
        d = f"M{f(pts[0][0])} {f(pts[0][1])} L{f(pts[1][0])} {f(pts[1][1])} "
        a, b, e = m(*c1), m(*c2), m(*p3)
        d += f"C{f(a[0])} {f(a[1])} {f(b[0])} {f(b[1])} {f(e[0])} {f(e[1])} "
        a, b, e = m(*q1), m(*q2), m(*q3)
        d += f"C{f(a[0])} {f(a[1])} {f(b[0])} {f(b[1])} {f(e[0])} {f(e[1])} "
        fl = m(u1, v_floor)
        d += f"L{f(fl[0])} {f(fl[1])} Z"
        return d

    d = poly([(LEFT, CY - HALF), (TIP, CY), (LEFT, CY + HALF)])
    for i in range(bays):
        d += " " + arch(i + pier, i + 1)
    write(name, "Riwaq — an arcade receding to a point", d, evenodd=True)


def arc_cubics(cx: float, cy: float, r: float, a0: float, a1: float, segs: int):
    """Cubic control points for a circular arc (SVG y-down angles in degrees). Returns [(c1, c2, p3), ...]."""
    out = []
    step = (a1 - a0) / segs
    k = 4 / 3 * math.tan(math.radians(abs(step)) / 4) * r * (1 if step > 0 else -1)
    for i in range(segs):
        s, e = math.radians(a0 + i * step), math.radians(a0 + (i + 1) * step)
        p0 = (cx + r * math.cos(s), cy + r * math.sin(s))
        p3 = (cx + r * math.cos(e), cy + r * math.sin(e))
        c1 = (p0[0] - k * math.sin(s), p0[1] + k * math.cos(s))
        c2 = (p3[0] + k * math.sin(e), p3[1] - k * math.cos(e))
        out.append((c1, c2, p3))
    return out


def riwaq_horseshoe(c: float = 0.6, margin: float = 0.42, opening: float = 0.64, bays: int = 3,
                    v_floor: float = 0.72, v_apex: float = -0.56, bulge: float = 0.1, point: float = 0.12,
                    name: str = "b-riwaq-horseshoe") -> None:
    """Riwaq with Maghrebi pointed horseshoe arches (Tlemcen / Algiers Great Mosque type).

    Arches are drawn in frontal pixel space, then mapped through the perspective homography.
    """
    sx, sy = W * c, HALF  # frontal px per u / per v at the near end

    def m(X: float, Y: float):
        u, v = X / sx, Y / sy
        k = 1.0 / (1.0 + c * u)
        return (TIP - W * k, CY + HALF * v * k)

    def pt(p):
        x, y = m(*p)
        return f"{f(x)} {f(y)}"

    w = opening * sx
    e = point * w  # centre offset -> pointed apex
    R = (0.5 + bulge) * w + e  # leftmost reach = Xm + e - R = Xm - (0.5 + bulge) w
    dy_j = math.sqrt(R * R - (0.5 * w + e) ** 2)  # jamb meets the arc this far below the centre
    rise = math.sqrt(R * R - e * e)  # apex this far above the centre
    yc = v_apex * sy + rise
    yf = v_floor * sy
    a_jl = math.degrees(math.atan2(dy_j, -(0.5 * w + e)))
    a_al = math.degrees(math.atan2(-rise, -e)) + 360
    a_ar = math.degrees(math.atan2(-rise, e)) + 360
    a_jr = math.degrees(math.atan2(dy_j, 0.5 * w + e)) + 360

    d = poly([(LEFT, CY - HALF), (TIP, CY), (LEFT, CY + HALF)])
    for i in range(bays):
        xm = (margin + i + opening / 2) * sx
        xl, xr = xm - w / 2, xm + w / 2
        seg = f" M{pt((xl, yf))} L{pt((xl, yc + dy_j))}"
        for c1, c2, p3 in arc_cubics(xm + e, yc, R, a_jl, a_al, 2) + arc_cubics(xm - e, yc, R, a_ar, a_jr, 2):
            seg += f" C{pt(c1)} {pt(c2)} {pt(p3)}"
        seg += f" L{pt((xr, yf))} Z"
        d += seg
    write(name, "Riwaq — an arcade receding to a point", d, evenodd=True)


# ---------------------------------------------------------------- A: Ghayth (the rain of knowledge)
def ghayth(tip_angle: float = 60.0, width: float = 196.0, cut: float = 0.0, name: str = "a-ghayth") -> None:
    """A drop lying on its side: a circle with two tangents meeting at the tip (play direction).

    tip_angle: full angle at the point (60 = same slope as the play triangle).
    cut: if > 0, the drop's back is trimmed flat by this many units (reads more like play).
    """
    half = math.radians(tip_angle / 2)
    k = 1 + 1 / math.sin(half)  # total width = r * k
    r = width / k
    xc = 128 - width / 2 + r + 4  # +4 optical shift toward the point
    tipx = xc + r / math.sin(half)
    # tangent points at angle (90 - half) from the +x axis, above and below
    a = math.radians(90) - half
    up = (xc + r * math.cos(a), CY - r * math.sin(a))
    lo = (xc + r * math.cos(a), CY + r * math.sin(a))
    d = (f"M{f(tipx)} {f(CY)} L{f(up[0])} {f(up[1])} "
         f"A{f(r)} {f(r)} 0 1 0 {f(lo[0])} {f(lo[1])} Z")
    write(name, "Ghayth — a drop of rain tipped forward", d)


# ---------------------------------------------------------------- A: Lisan (the manuscript flap)
def lisan(w: float = 184.0, h: float = 208.0, m: float = 40.0, gap: float = 12.0, rc: float = 18.0,
          phi_deg: float = 30.0, name: str = "a-lisan") -> None:
    """A closed Arabic manuscript seen from the front. Arabic books open on the left, so the envelope
    flap (lisan) folds over from the left edge and points right: it is a play triangle.

    w, h: cover size; m: flap inset from the top/bottom of the cover; gap: separation between flap and cover;
    rc: corner radius; phi_deg: angle of the flap's slanted edges (30 = equilateral play).
    """
    L, T = 128 - w / 2, 128 - h / 2
    R, B = L + w, T + h
    phi = math.radians(phi_deg)
    half = h / 2 - m
    tipx = L + half / math.tan(phi)
    # gap band: the flap's slanted edges offset outward by `gap`
    dy = gap / math.cos(phi)
    gtip = tipx + gap / math.sin(phi)
    k = 0.5523 * rc
    cover = (
        f"M{f(L)} {f(T + rc)} C{f(L)} {f(T + rc - k)} {f(L + rc - k)} {f(T)} {f(L + rc)} {f(T)} "
        f"L{f(R - rc)} {f(T)} C{f(R - rc + k)} {f(T)} {f(R)} {f(T + rc - k)} {f(R)} {f(T + rc)} "
        f"L{f(R)} {f(B - rc)} C{f(R)} {f(B - rc + k)} {f(R - rc + k)} {f(B)} {f(R - rc)} {f(B)} "
        f"L{f(L + rc)} {f(B)} C{f(L + rc - k)} {f(B)} {f(L)} {f(B - rc + k)} {f(L)} {f(B - rc)} "
        f"L{f(L)} {f(CY + half + dy)} L{f(gtip)} {f(CY)} L{f(L)} {f(CY - half - dy)} Z"
    )
    flap = poly([(L, CY - half), (tipx, CY), (L, CY + half)])
    write(name, "Lisan — the flap of a closed Arabic manuscript, pointing forward", cover + " " + flap)


# ---------------------------------------------------------------- A: Qalam (a play drawn with the reed pen)
def qalam_parts(nib: float = 50.0, nib_deg: float = 60.0, half: float = 76.0, shift: float = 0.0):
    """The three nib-swept parallelograms of the Qalam mark (same winding), on the 256 canvas."""
    t = math.radians(nib_deg)
    vx, vy = nib / 2 * math.cos(t), -nib / 2 * math.sin(t)
    w = half * SQ3
    x0 = 128 - w / 2 + shift
    A, Bp, C = (x0, CY - half), (x0 + w, CY), (x0, CY + half)

    def para(p, q):
        pts = [(p[0] + vx, p[1] + vy), (q[0] + vx, q[1] + vy), (q[0] - vx, q[1] - vy), (p[0] - vx, p[1] - vy)]
        area = sum(pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1] for i in range(4))
        return pts if area > 0 else pts[::-1]

    return [para(p, q) for p, q in ((A, Bp), (Bp, C), (C, A))]


def qalam(nib: float = 48.0, nib_deg: float = 60.0, half: float = 76.0, shift: float = 0.0,
          name: str = "a-qalam") -> None:
    """A play triangle drawn with a broad-nib reed pen held at a fixed angle.

    Each edge is the area swept by the nib (a parallelogram); their union is the mark. The pen angle gives the
    calligraphic contrast: with the nib at 60 degrees the upper edge is full width, the other two are half.
    half: half-height of the pen path; shift: optical x shift.
    """
    t = math.radians(nib_deg)
    vx, vy = nib / 2 * math.cos(t), -nib / 2 * math.sin(t)  # nib edge rises to the right (SVG y-down)
    w = half * SQ3
    x0 = 128 - w / 2 + shift
    A, Bp, C = (x0, CY - half), (x0 + w, CY), (x0, CY + half)

    def para(p, q):
        pts = [(p[0] + vx, p[1] + vy), (q[0] + vx, q[1] + vy), (q[0] - vx, q[1] - vy), (p[0] - vx, p[1] - vy)]
        area = sum(pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1] for i in range(4))
        return pts if area > 0 else pts[::-1]  # same winding for all -> nonzero union

    d = " ".join(poly(para(p, q)) for p, q in ((A, Bp), (Bp, C), (C, A)))
    write(name, "Qalam — a play button drawn with the reed pen", d)


# ---------------------------------------------------------------- C: Darajat
def darajat_symmetric(n: int = 4, name: str = "c-darajat-sym") -> None:
    step = W / n
    top, bottom = [], []
    for k in range(n):
        x0, x1 = LEFT + k * step, LEFT + (k + 1) * step
        h = half_height((x0 + x1) / 2)
        top += [(x0, CY - h), (x1, CY - h)]
        bottom.insert(0, [(x1, CY + h), (x0, CY + h)])
    write(name, "Darajat — steps to a point", poly(top + [p for pair in bottom for p in pair]))


def darajat_minbar(n: int = 3, name: str = "c-darajat-minbar") -> None:
    """Straight lower edge (the minbar's rail), stepped upper edge (its stairs)."""
    step = W / n
    pts = [(LEFT, CY + HALF)]
    for k in range(n):
        x0, x1 = LEFT + k * step, LEFT + (k + 1) * step
        h = half_height(x0 + step * 0.35)
        pts += [(x0, CY - h), (x1, CY - h)]
    tip_h = half_height(TIP - step * 0.65)
    pts[-1] = (TIP, CY - tip_h)
    pts.append((TIP, CY))
    dy = -5.0  # the top tread sits below the envelope; lift the whole mark to centre it optically
    write(name, "Darajat — a minbar of steps pointing forward", poly([(x, y + dy) for x, y in pts]))


if __name__ == "__main__":
    qalam(nib=50, name="a-qalam")
    riwaq_horseshoe(c=0.55, margin=0.45, opening=0.6, point=0.3, bulge=0.07, bays=3, name="b-riwaq")
    darajat_minbar(4, "c-darajat")
