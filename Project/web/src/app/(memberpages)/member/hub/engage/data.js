"use client";
// Data hooks for the engagement features (/api/v1/engagement/*). Every number comes from the server; the browser
// never sends a points value. A failed read returns isError and the screen shows an error state, never a guess.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMember } from "@/Context";
import { api } from "@/util";
import { useRewardsTick } from "@/hooks/useRewardsRefresh";

const ok = (r) => r && r.status !== "error";
const fail = (r) => { const e = new Error((r && r.message) || "request failed"); e.code = r?.code; throw e; };
export const E = "/api/v1/engagement";

export async function get(path) { const r = await api.get(`${E}${path}`); if (!ok(r)) fail(r); return r.data; }
export async function send(method, path, body) { const r = await api[method](`${E}${path}`, body || {}); if (!ok(r)) fail(r); return r.data; }

const dates = (e) => ({ ...e, at: e.at ? new Date(e.at) : null, clearsAt: e.clearsAt ? new Date(e.clearsAt) : null });

export function useEngage(key, path, { enabled = true, tickDep = true, staleTime = 30_000, select } = {}) {
  const member = useMember();
  const tick = useRewardsTick();
  return useQuery({
    queryKey: ["engage", key, member?._id, tickDep ? tick : 0, path],
    enabled: Boolean(member?._id) && enabled,
    queryFn: () => get(path),
    select,
    staleTime,
  });
}

export const useEngageConfig = () => useEngage("config", "/config", { tickDep: false, staleTime: 300_000 });
export const useSummary = () => useEngage("summary", "/summary", {
  select: (d) => ({ ...d, onHold: (d.onHold || []).map(dates) }),
});

export function qs(filters = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== null && v !== "") p.set(k, Array.isArray(v) ? v.join(",") : String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}
export const useLedgerPage = (filters) => useEngage("ledger", `/ledger${qs(filters)}`, {
  select: (d) => ({ ...d, items: (d.items || []).map(dates) }),
});
export const ledgerCsvUrl = (filters) => `${E}/ledger.csv${qs(filters)}`;

export function useEngageMutation(method, path, { invalidate = [] } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => send(method, typeof path === "function" ? path(body) : path, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["engage"] });
      for (const k of invalidate) qc.invalidateQueries({ queryKey: k });
    },
  });
}

export const usePreferences = () => useEngage("prefs", "/preferences", { tickDep: false });
export const useSavePreferences = () => useEngageMutation("put", "/preferences");
