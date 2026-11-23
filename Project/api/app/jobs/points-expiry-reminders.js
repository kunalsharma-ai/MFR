// Daily: points expiry reminders.   node app/jobs/points-expiry-reminders.js [--dry-run]
// Does nothing unless config.expiry.enabled (there is no points expiry today). Never deducts points.
import mongoose from "mongoose";
import { runExpiryReminders } from "../engagement/expiry.js";

const dryRun = process.argv.includes("--dry-run");
await mongoose.connect(process.env.mongodb ?? "mongodb://db/mfr");
try {
    console.log(new Date().toISOString(), JSON.stringify(await runExpiryReminders({ dryRun })));
} finally {
    await mongoose.disconnect();
}
