# Teen question bank (Nov 2026)

Puts the Teen Panel question bank into the member-hub **Profiles** page for teens (category `b2c-minor`).

The bank itself is `frontend-1/src/teen/data/teenProfiles.js`: the "Master profiling question bank | Ages 13–17"
(modules 02–28) merged with the earlier teen bank, with one key per question and no repeated options. Earlier keys are
kept wherever the master file asks the same thing (their stored answers stay valid) and the master file's missing
options are added. `frontend-1/scripts/teen-content-sync.mjs` writes `bank.json` here from it. Do not edit `bank.json`.

## Parent profiling

The parent's onboarding form (`parentSurvey.js`) has two optional sections, **Your home** (H02, H03, H002, H003, H005,
H006, H007, G006) and **Work & income** (S001–S005), with the same keys and values as the teen bank. When the teen's
account is switched on, whatever the parent answered is copied into the teen's profile. The teen sees it but cannot
change it; questions the parent skipped stay open for the teen. The answers also show on the "What your parent told us"
cards in the teen's profile. Staying in touch gains P13–P15 and the P07 option "Through my parent dashboard".

## Run

From `Project/api`, with the `mongodb` env set as for the API. Run it after `question-bank-2026-11/fix.mjs`.

```sh
node scripts/teen-bank-2026-11/sync.mjs              # dry run on a copy (<db>_teenbank_dryrun), prints counts
node scripts/teen-bank-2026-11/sync.mjs --apply      # full backup to backups/<time>/, then changes the real data
node scripts/question-bank-2026-11/verify.mjs        # exits 1 if a profile asks a missing question or options repeat
node scripts/teen-bank-2026-11/sync.mjs --restore scripts/teen-bank-2026-11/backups/<time>   # undo
```

What `--apply` changes, per origin:

1. 237 questions (lower-case key names such as `d04`, `hp001_snacks`, category `b2c-minor`) and their options, exactly
   as in the bank. Options no longer in the bank are retired, never removed. Show-when rules become `parent` plus option
   `parentValue`.
2. 23 profiles with slugs `teen-*`.
3. The 13 old `minor` profiles (adult questions reused for teens) are switched off. Their questions and answers are not touched.
4. Answers the teen API saved under an upper-case key (`D04`) are renamed to the lower-case name (`d04`), for teen
   accounts only. The API now saves lower case and still reads old upper-case answers.

Not in the hub: date of birth, country and region (from registration) and the time zone (welcome survey only).
Running it twice changes nothing the second time.

Tested on the T2O exports plus 300 synthetic members after `fix.mjs`: 0 verify errors, second run a no-op.
