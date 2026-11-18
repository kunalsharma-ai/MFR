// Notifications closed with × stay off for the rest of this visit (kept in memory, so moving between pages keeps
// them off). A refresh or a new visit starts clean and shows them again (Kunal, 18 Nov).
const off = new Set();
export const isDismissed = (key) => off.has(key);
export const dismiss = (key) => { off.add(key); };
