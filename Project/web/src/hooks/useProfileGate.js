"use client";
// Which profiles the member has to finish before the surveys open, and what is still left.
//
//   1. Basic, Education, Professional and Financial are filled on the Profiles page.
//   2. When those four are complete, the other profiles open. They are listed in the Survey section (as cards, like the Profiles page) and
//      filled with the same profile form (/member/profiles?profile=<slug>); a completed one pays its points, raises the Quality Score and
//      moves to "Completed" on the Profiles page.
//   3. When every profile is complete, the surveys open. A survey that reaches the member before that is shown, but locked.
//
// Everything is read from the database: POST /api/v1/profile (the member's category decides the profiles: b2c, b2b, minor...),
// POST /api/v1/me/survey (the member's surveys, with the participation status) and GET /api/v1/rewards (which profiles were paid,
// found by the [profile:<slug>] tag).
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/util";
import { useMember } from "@/Context";
import { bumpRewards, useRewardsTick, readPaidProfiles, creditCardRewards, creditQualityScore } from "@/hooks/useRewardsRefresh";
import { isCore, basicsDone, questionCountOf, DEFAULT_PROFILE_POINTS } from "@/app/(memberpages)/member/(member pages)/profiles/ps/profileRules";

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
    // the four basics (the ones that exist for this category) in the database order, with their progress: the lock pop-up lists them
    const core = profiles.filter((p) => isCore(p.slug)).map((p) => ({ slug: p.slug, name: p.name, done: Number(p.status) >= 100 || paid[p.slug] !== undefined }));
    const isDone = (p) => paid[p.slug] !== undefined || Number(p.status) >= 100 || mine.get(slugOf(p))?.participationStatus === "complete";
    // every other profile of the member's category, as the database has it
    const extras = profiles
      .filter((p) => !isCore(p.slug))
      .map((p) => {
        const questions = questionCountOf(p);
        // points: the ones set on the profile in the admin (the same value is paid when it is completed)
        return { ...p, done: isDone(p), questions, points: Number(p.points) || DEFAULT_PROFILE_POINTS, loi: Math.max(1, Math.round((questions * 8) / 60)) };
      });
    const pending = extras.filter((p) => !p.done);
    return {
      loading,
      coreDone,
      core,
      extras,
      pending,
      allDone: coreDone && pending.length === 0,
      paid, // { slug: points paid } from the rewards in the database
      profileSlugs: new Set(extras.map((p) => slugOf(p))), // a survey with one of these slugs is the profile itself, not a normal survey
    };
  }, [enabled, profilesQ.isLoading, profilesQ.data, surveysQ.isLoading, surveysQ.data, paidQ.isLoading, paidQ.data]);
}

let syncing = null;
/**
 * Pays what the member's completed surveys are worth, once each:
 *  - a completed profile survey: its points as a reward, so it is a completed profile (Reward Balance, Prize Machine, header)
 *  - any completed survey: +1 Quality Score
 * Safe to call as often as you like (a survey just finished, a page opened): the rewards and the score keep their own "already paid" marks.
 */
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
