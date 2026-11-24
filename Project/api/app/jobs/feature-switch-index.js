// Run once per database, before or right after deploying switches per segment and country:
//   node app/jobs/feature-switch-index.js [--dry-run]
// FeatureSwitch rows used to be unique on (origin, key). Now a brand can have narrower rows for one segment and/or
// country, so that old index must go. This drops it and builds the new (origin, key, segment, country) index. It changes
// no rows: an existing row has no segment and no country, so it stays the whole-brand setting.
import mongoose from "mongoose";
import { FeatureSwitch } from "../model/index.js";

const dryRun = process.argv.includes("--dry-run");
await mongoose.connect(process.env.mongodb ?? "mongodb://db/mfr");
try {
    const indexes = await FeatureSwitch.collection.indexes().catch(() => []);
    const old = indexes.find((i) => i.unique && JSON.stringify(i.key) === JSON.stringify({ origin: 1, key: 1 }));
    if (old && !dryRun) await FeatureSwitch.collection.dropIndex(old.name);
    if (!dryRun) await FeatureSwitch.syncIndexes();
    console.log(new Date().toISOString(), JSON.stringify({ dryRun, droppedOld: Boolean(old), oldIndex: old?.name || null }));
} finally {
    await mongoose.disconnect();
    process.exit(0); // the shared utils keep timers open, so exit once the work is done
}
