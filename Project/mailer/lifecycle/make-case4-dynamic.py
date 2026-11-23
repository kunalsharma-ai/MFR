#!/usr/bin/env python3
"""Turn the v6 case4-partial.liquid (sample figures baked in: 4 of 37, 400 points, Player...) into a template that
prints the member's real progress. Run it on a fresh build of mfr-v6/react/dist/liquid/case4-partial.liquid:

    python3 make-case4-dynamic.py <in.liquid> <out.liquid>

Merge fields it expects (built by api/app/engagement/lifecycle.js):
  p.done p.total p.left p.points p.rank p.next_rank p.to_next_rank p.core_done (true/false)
  p.to_dollar_points p.to_dollar_profiles p.dollar_pct p.dollar_rest_pct p.left_points p.left_usd p.rank_index
Every replacement must hit exactly the expected number of times, or the script stops, so a changed design is noticed.
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

# subject lines / title / preheader
rep('are a Player now — 400 points banked', 'are a {{ p.rank }} now — {{ p.points }} points banked', 2)
rep('Four capsules collected. The category ones pay the same', '{{ p.done }} capsules collected. The rest pay the same', 1)
rep('You are 600 points from your first dollar', 'You are {{ p.to_dollar_points }} points from your next dollar', 1)
rep('Six more profiles takes you to 1,000 points, which is $1. Two to three minutes each.',
    '{{ p.to_dollar_profiles }} more {% if p.to_dollar_profiles == 1 %}profile takes{% else %}profiles take{% endif %} you to your next dollar. Two to three minutes each.', 2)
# purpose band
rep('Four capsules collected — and ', '{{ p.done }} capsules collected — and ', 1)
rep('Your general profiles are done. The category profiles are not, and those are the ones survey invitations are screened against.',
    '{{ p.left }} profiles are still open, and survey invitations are screened against them.', 1)
rep('33 still waiting', '{{ p.left }} still waiting', 1)
rep('>400 points banked<', '>{{ p.points }} points banked<', 1)
rep('Rank: Player', 'Rank: {{ p.rank }}', 1)
rep('600 points to your first $1', '{{ p.to_dollar_points }} points to your next $1', 1)
# headline + lead
rep(', you’re a Player now.', ', you’re a {{ p.rank }} now.', 1)
rep('Four capsules collected and 400 reward points banked. That is the hard part done — and the part most members never get past.',
    '{{ p.done }} capsules collected and {{ p.points }} reward points banked. Every profile you finish widens the studies we can match you to.', 1)
# big stats
rep('>4 of 37<', '>{{ p.done }} of {{ p.total }}<', 1)
rep('>400<', '>{{ p.points }}<', 1)
rep('>Player<', '>{{ p.rank }}<', 1)
# concern panel
rep('The four general profiles are complete. Well done.',
    '{% if p.core_done %}The four general profiles are complete. Well done.{% else %}{{ p.done }} of your profiles are complete. Well done.{% endif %}', 1)
rep('The category profiles are not, and those are the ones survey invitations are screened against.',
    '{{ p.left }} profiles are still open, and survey invitations are screened against them.', 1)
rep('Each category profile takes two to three minutes and pays the same 100 points.', 'Each profile takes two to three minutes and pays the same 100 points.', 1)
# run to the dollar
rep('600 points away', '{{ p.to_dollar_points }} points away', 1)
rep('>400 points<', '>{{ p.points }} points<', 1)
rep('width="40%"', 'width="{{ p.dollar_pct }}%"', 1)
rep('width:40%', 'width:{{ p.dollar_pct }}%', 1)
rep('width="60%"', 'width="{{ p.dollar_rest_pct }}%"', 1)
rep('Six more profiles clears it. At two to three minutes each, that is roughly a quarter of an hour in total.',
    '{{ p.to_dollar_profiles }} more {% if p.to_dollar_profiles == 1 %}profile clears{% else %}profiles clear{% endif %} it, at two to three minutes each.', 1)
# rank cards + statement
rep('13 capsules to Pro', '{% if p.next_rank %}{{ p.to_next_rank }} capsules to {{ p.next_rank }}{% else %}Top rank reached{% endif %}', 1)
rep('Pro is the next rung up from Player.', '{% if p.next_rank %}{{ p.next_rank }} is the next rung up from {{ p.rank }}.{% endif %}', 1)
rep('Thirty-three capsules, 3,300 points, $3.30 still on the table.', '{{ p.left }} capsules, {{ p.left_points }} points, {{ p.left_usd }} still on the table.', 1)
# the rank ladder picture only exists for Player; hide it for other ranks (the rank is in the stats above)
i = s.find('/g3d/rank-1.png')
if i < 0: sys.exit("rank-1 image not found")
a = s.rfind('<table', 0, i); b = s.find('</table>', i) + len('</table>')
s = s[:a] + '{% if p.rank_index == 1 %}' + s[a:b] + '{% endif %}' + s[b:]

body = s[s.find('{%- endcomment -%}'):]
for left in ['33 still', 'Player now', '4 of 37', '600 points', 'Thirty-three', '400 points']:
    if left in body: sys.exit(f"sample figure left behind: {left}")
open(dst, "w", encoding="utf-8").write(s)
print("ok", dst)
