// Hourly: sign-up funnel + profile reminders (v6 lifecycle cases 1-4) and, once a day, birthday greetings.
//   node app/jobs/lifecycle-emails.js [--dry-run] [--force]
// Does nothing unless config.emails.lifecycle.enabled / config.emails.birthday are true (ENGAGEMENT_CONFIG).
// (cron example:  23 * * * *  cd /src && node app/jobs/lifecycle-emails.js >> app/logs/lifecycle-emails.log 2>&1)
import mongoose from "mongoose";
import { runLifecycle } from "../engagement/lifecycle.js";
import { runBirthdays } from "../engagement/transactional.js";

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
await mongoose.connect(process.env.mongodb ?? "mongodb://db/mfr");
try {
    const lifecycle = await runLifecycle({ dryRun, force });
    // birthdays: run in the 09:00 UTC hour only, so each member gets one per day even with an hourly cron
    const birthdays = new Date().getUTCHours() === 9 || force ? await runBirthdays({ dryRun, force }) : { skipped: "not the birthday hour" };
    console.log(new Date().toISOString(), JSON.stringify({ lifecycle, birthdays }));
} finally {
    await mongoose.disconnect();
}
