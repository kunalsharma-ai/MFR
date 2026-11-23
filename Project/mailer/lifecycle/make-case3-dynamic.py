#!/usr/bin/env python3
"""Make the v6 case3-noprofiles.liquid print the real profile count and points per profile instead of the design's
sample figures (37 profiles, 100 points each, 3,700 points, $3.70).

    python3 make-case3-dynamic.py <in.liquid> <out.liquid>

Merge fields (api/app/engagement/lifecycle.js): p.total p.per_profile p.total_points p.total_usd p.player_at
"""
import sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()

def rep(old, new, count):
    global s
    n = s.count(old)
    if n != count:
        sys.exit(f"expected {count} x {old!r}, found {n}")
    s = s.replace(old, new)

rep('0 of 37 profiles done', '0 of {{ p.total }} profiles done', 1)
rep('Each capsule is 100 reward points.', 'Each capsule is {{ p.per_profile }} reward points.', 1)
rep('+100 points', '+{{ p.per_profile }} points', 1)
rep('>+100<', '>+{{ p.per_profile }}<', 5)
rep('>37<', '>{{ p.total }}<', 1)
rep('>3,700<', '>{{ p.total_points }}<', 1)
rep('>$3.70<', '>{{ p.total_usd }}<', 1)
rep('37 slots, 0 filled', '{{ p.total }} slots, 0 filled', 1)
rep('same 100 points', 'same {{ p.per_profile }} points', 1)
rep('Eight profiles makes you a Player.', '{{ p.player_at }} profiles makes you a Player.', 1)

body = s[s.find('{%- endcomment -%}'):]
for left in ['3,700', '$3.70', '0 of 37', '100 reward']:
    if left in body: sys.exit(f"sample figure left behind: {left}")
open(dst, "w", encoding="utf-8").write(s)
print("ok", dst)
