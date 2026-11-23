// Hourly job: Teen registration reminders and expiry.   node app/jobs/teen-reminders.js [--dry-run]
// (cron example: 7 * * * *  cd /src && node app/jobs/teen-reminders.js >> app/logs/teen-reminders.log 2>&1)
import mongoose from "mongoose";
import { sweep } from "../teen/service.js";

const dryRun = process.argv.includes("--dry-run");
await mongoose.connect(process.env.mongodb ?? "mongodb://db/mfr");
try {
    const report = await sweep({ dryRun });
    console.log(new Date().toISOString(), dryRun ? "(dry run)" : "", JSON.stringify(report));
} finally {
    await mongoose.disconnect();
}
