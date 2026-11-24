"use client";
// Round 9: the state of the Teen's Parent Section (parent onboarding, the parent's reward preferences, parental consent).
//
// Where the truth lives:
//   - GET /api/v1/teen/me/family: once the parent has finished on the secure link we emailed them, the server returns
//     ready: true with their answers and their consent. That always wins, and the forms then show what was sent.
//   - Before that, what a parent types here is kept as a draft on this device (one record per Teen, so coming back or
//     changing an answer never makes a second copy) and sent with sendParentForm().
// Nothing is ever filled in for the parent: every field starts empty.
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/util";
import { useMember } from "@/Context";

const KEY = (id) => `mfr.teen.parent.${id || "anon"}`;
const EMPTY = { onb: { a: {}, step: 0, status: "new" }, rew: { a: {}, status: "new" }, con: { read: [], sel: {}, assent: null, status: "new" } };

// Sending from the Teen's account is switched off until the API route and the legal check are done (standing rule:
// legal features ship switched off). The single-file preview turns it on so the whole journey can be tried.
export const PARENT_FORMS_LIVE = () => (typeof window !== "undefined" && Boolean(window.__PERSONAS)) || process.env.NEXT_PUBLIC_TEEN_PARENT_FORMS === "on";

const read = (id) => {
  try { const v = JSON.parse(localStorage.getItem(KEY(id)) || "null"); return v ? { ...EMPTY, ...v, onb: { ...EMPTY.onb, ...v.onb }, rew: { ...EMPTY.rew, ...v.rew }, con: { ...EMPTY.con, ...v.con } } : EMPTY; } catch (e) { return EMPTY; }
};
const listeners = new Set();

export function useFamily() {
  const member = useMember();
  return useQuery({
    queryKey: ["teen", "family", member?._id],
    enabled: Boolean(member?._id) && member?.category === "b2c-minor",
    queryFn: async () => {
      const r = await api.get("/api/v1/teen/me/family");
      if (!r || r.status === "error") throw new Error(r?.message || "request failed");
      return r.data;
    },
    staleTime: 60_000,
  });
}

export function useParentForms() {
  const member = useMember();
  const id = member?._id;
  const [state, setState] = React.useState(EMPTY);
  React.useEffect(() => {
    setState(read(id));
    const on = () => setState(read(id));
    listeners.add(on);
    return () => listeners.delete(on);
  }, [id]);
  const update = React.useCallback((part, patch) => {
    const cur = read(id);
    const next = { ...cur, [part]: { ...cur[part], ...(typeof patch === "function" ? patch(cur[part]) : patch), savedAt: new Date().toISOString() } };
    try { localStorage.setItem(KEY(id), JSON.stringify(next)); } catch (e) { /* storage blocked: the form still works for this visit */ }
    setState(next);
    listeners.forEach((l) => l());
  }, [id]);
  return [state, update];
}

// Sends one form. In the preview it is recorded on this device; in production it posts once the route is switched on.
export async function sendParentForm(kind, payload) {
  if (typeof window !== "undefined" && window.__PERSONAS) { await new Promise((r) => setTimeout(r, 900)); return { ok: true }; }
  const r = await api.post(`/api/v1/teen/me/parent/${kind}`, payload);
  if (!r || r.status === "error" || r.status === "fail") throw new Error(r?.message || "send failed");
  return { ok: true };
}

// One status for the whole Parent Section, used by the cards, the journey and the survey lock.
export function useParentStatus() {
  const member = useMember();
  const applies = member?.category === "b2c-minor";
  const fam = useFamily();
  const [forms] = useParentForms();
  const server = Boolean(fam.data?.ready);
  const onb = server ? "verified" : forms.onb.status;
  const con = server ? "verified" : forms.con.status;
  const sent = (s) => s === "submitted" || s === "verified";
  return {
    applies, loading: applies && fam.isLoading, server, onb, con,
    // a family API that cannot be reached never locks a Teen out
    done: !applies || server || fam.isError || (sent(onb) && sent(con)),
  };
}

export const useInvalidateFamily = () => {
  const qc = useQueryClient();
  const member = useMember();
  return () => qc.invalidateQueries({ queryKey: ["teen", "family", member?._id] });
};
