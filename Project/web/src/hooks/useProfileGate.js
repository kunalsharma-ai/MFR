"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/util";
import { useMember } from "@/Context";
import { bumpRewards, useRewardsTick, readPaidProfiles, creditCardRewards, creditQualityScore } from "@/hooks/useRewardsRefresh";
import { isCore, basicsDone } from "@/app/(memberpages)/member/(member pages)/profiles/ps/profileRules";

const slugOf = (x) => String(x?.slug || "").toLowerCase();
const fetchProfiles = (category) => api.post("/api/v1/profile", { category }).then((r) => (Array.isArray(r?.data) ? r.data : []));
const fetchMySurveys = () => api.post("/api/v1/me/survey", {}).then((r) => (Array.isArray(r?.data) ? r.data : []));

export default function useProfileGate() {
  const user = useMember();
  const tick = useRewardsTick(); // read again right after something was paid
  const enabled = Boolean(user?._id && user?.category);
  // same key as the Profiles page, so both share one request
  const profilesQ = useQuery({ queryKey: ["profiles", user?.category, "false"], queryFn: () => fetchProfiles(user.category), enabled });
  const surveysQ = useQuery({ queryKey: ["my-surveys-all", user?._id, tick], queryFn: fetchMySurveys, enabled, retry: false });
  const paidQ = useQuery({ queryKey: ["ps-paid", user?._id, tick], queryFn: () => readPaidProfiles(user), enabled, retry: false });

  return useMemo(() => {
    const loading = !enabled || profilesQ.isLoading || surveysQ.isLoading || paidQ.isLoading;
    const profiles = profilesQ.data || [];
    const surveys = surveysQ.data || [];
    const paid = paidQ.data || {};
    const mine = new Map(surveys.map((s) => [slugOf(s), s])); // the member's responses
    const coreDone = basicsDone(profiles);
    const isDone = (p) => paid[p.slug] !== undefined || Number(p.status) >= 100 || mine.get(slugOf(p))?.participationStatus === "complete";
    // every other profile of the member's category, as the database has it
    const extras = profiles
      .filter((p) => !isCore(p.slug))
      .map((p) => {
        const questions = (p.pages || []).reduce((n, pg) => n + Math.max(0, (pg?.length || 1) - 1), 0);
        return { ...p, done: isDone(p), questions, points: Number(p.points) || 50, loi: Math.max(1, Math.round((questions * 8) / 60)) };
      });
    const pending = extras.filter((p) => !p.done);
    return {
      loading,
      coreDone,
      extras,
      pending,
      allDone: coreDone && pending.length === 0,
      paid, // { slug: points paid } from the rewards in the database
      profileSlugs: new Set(extras.map((p) => slugOf(p))), // a survey with one of these slugs is the profile itself, not a normal survey
    };
  }, [enabled, profilesQ.isLoading, profilesQ.data, surveysQ.isLoading, surveysQ.data, paidQ.isLoading, paidQ.data]);
}

let syncing = null;

export function syncSurveyRewards(user) {
  if (!user?._id || !user?.category) return Promise.resolve();
  if (syncing) return syncing;
  syncing = (async () => {
    try {
      const [surveys, profiles] = await Promise.all([fetchMySurveys(), fetchProfiles(user.category)]);
      const done = surveys.filter((s) => s?.participationStatus === "complete" && s?.slug);
      if (!done.length) return;
      const profileSlugs = new Set(profiles.filter((p) => !isCore(p.slug)).map(slugOf));
      const cards = done.filter((s) => profileSlugs.has(slugOf(s))).map((s) => ({ slug: slugOf(s), name: s.name, points: s.points }));
      const paid = await creditCardRewards(user, cards);
      const quality = await creditQualityScore(user, done.map((s) => `survey:${slugOf(s)}`));
      if (paid || quality) {
        bumpRewards(); // sidebar, header, dashboard and My Account read the new balance
        await user?.Reload?.(); // the header reads the new Quality Score
      }
    } catch (e) {
      console.log(e);
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}
