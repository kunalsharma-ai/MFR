// Weekly points recap emails.   node app/jobs/weekly-summary.js [--dry-run] [--force]
// Does nothing unless config.weeklySummary.enabled is true (ENGAGEMENT_CONFIG), or --force is given for a one-off.
// (cron example, Mondays 09:15:  15 9 * * 1  cd /src && node app/jobs/weekly-summary.js >> app/logs/weekly-summary.log 2>&1)
import mongoose from "mongoose";
import { runWeekly } from "../engagement/weekly.js";

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
await mongoose.connect(process.env.mongodb ?? "mongodb://db/mfr");
try {
    const report = await runWeekly({ dryRun, force });
    console.log(new Date().toISOString(), JSON.stringify(report));
} finally {
    await mongoose.disconnect();
}
