# Question bank clean-up (Nov 2026)

Merges the old profiles (financial, home-pet, lifestyle-food, travel, automobile, health, beauty, tech, sports, game, mr)
into the Survey 2026 profiles, with no question asked twice and no option listed twice, and applies the fixes from the
bank check against the 22 Survey 2026 documents.

- **Merge** (58 questions): when a new question asks the same thing as an old one, the old question's missing options are
  added to the new question, members' answers are copied to the new question through a value map, questions shown under
  the old one are re-pointed to the new one, and the old question is retired. A member who already answered the new
  question keeps their own answer.
- **Move** (123 questions): an old question with no twin moves into the new profile where it belongs.
- The old profiles end up empty and are switched off (`isActive: false`). Teen (`minor`) profiles keep working: a merged
  question is replaced by its new question in place. Teen profiles get no tobacco, nicotine or alcohol questions.
- Nothing is hard-deleted from the bank; retired rows get `isDeleted: true, isActive: false`. Copied answers carry
  `migratedFrom`. The old answers stay in place.

`plan.json` lists every step in order and is the file to review. `fix.mjs` only carries it out.

## Run

From `Project/api`, with the `mongodb` env set as for the API:

```sh
node scripts/question-bank-2026-11/fix.mjs              # dry run: copies the 4 collections to <db>_qbfix_dryrun, runs there, prints counts
node scripts/question-bank-2026-11/fix.mjs --apply      # saves a full backup to backups/<time>/, then changes the real data
node scripts/question-bank-2026-11/verify.mjs           # exits 1 if a profile asks a missing question, a question is listed twice, or options repeat
node scripts/question-bank-2026-11/fix.mjs --restore scripts/question-bank-2026-11/backups/<time>   # undo (also removes answers given after the backup)
```

Options: `--uri mongodb://…`, `--origin <host>` (default: every origin found), `--keep` (keep the dry-run database).

The steps are safe to run twice: a step whose work is already done changes nothing.

Clear the browser option cache after applying: the member app caches option lists in `localStorage`.
