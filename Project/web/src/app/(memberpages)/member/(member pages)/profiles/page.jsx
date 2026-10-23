"use client";
import React from "react";
import {
  Box,
  Button,
  Grid,
  LinearProgress,
  Tab,
  Tabs,
  Typography,
  IconButton,
  MobileStepper,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
// import Question from "@/app/(memberpages)/survey/components/Question";
import Survey from "@/app/(memberpages)/survey/components/Survey";
import { api, Page } from "@/util";
import { useMember, useQuery as useQueryParameters } from "@/Context";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";
import { useToast } from "@/hooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bumpRewards, creditProfileRewards } from "@/hooks/useRewardsRefresh";
import "./ps/ps.css";
import PsHub from "./ps/PsHub";
import PsFlow from "./ps/PsFlow";
import { setRewardData } from "./ps/rules";
import { setProfileNames } from "./ps/i18n";
import { visibleProfiles, normalizeInterests, basicsDone, nextBasic, isCore } from "./ps/profileRules";

function TabLabel({ label, progress = 0, icon, selected }) {
  return (
    <Grid
      container
      spacing={2}
      alignItems="center"
      size={12}
      sx={{
        minWidth: { xs: "calc(100vw - 190px)", sm: 300 },
        px: { xs: 0, sm: 1 },
      }}
    >
      <i className={`fas ${icon}`} alt="icon" />

      <Grid sx={{ flex: 1 }}>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Typography
            sx={{ fontWeight: 500, fontSize: 12, textTransform: "capitalize" }}
          >
            {label}
          </Typography>
          <Typography>{progress && `${progress} %`}</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            ".MuiLinearProgress-bar": {
              bgcolor: (theme) =>
                selected ? "white" : theme.palette.primary.main,
            },
            width: "100%",
            height: 3,
            borderRadius: 1.5,
            bgcolor: (theme) =>
              selected ? "rgba(255,255,255,0.2)" : theme.palette.cardbg.main,
          }}
        />
      </Grid>
    </Grid>
  );
}

function ClassicProfiles() {
  const [editMode, setEditMode] = React.useState(false);
  const [user, query, router] = [
    useMember(),
    useQueryParameters(),
    useRouter(),
  ];
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["profiles", user?.category, editMode ? "true" : "false"],
    queryFn: () =>
      api
        .post("/api/v1/profile", { category: user.category })
        .then((r) => r.data),
    enabled: !!user?.category || !editMode,
  });
  if (profilesLoading || profiles.length === 0) return <></>;

  const activeTab = !query.profile
    ? 1
    : 1 + profiles.map((profile) => profile.slug).indexOf(query.profile);
  const selectedProfile = activeTab ? profiles.at(activeTab - 1) : profiles[0];
  const currentProfileIndex = query.profile
  ? profiles.findIndex((profile) => profile.slug === query.profile)
  : 0;

  const isFirstProfile = currentProfileIndex <= 0;
  const isLastProfile = currentProfileIndex >= profiles.length - 1;
  const allProfiles= profiles?.filter?.((profile) => Number(profile.status) > 0) || []
  const handlePreviousProfile = () => {
    if(isFirstProfile) return; 

    const previousProfile = allProfiles[currentProfileIndex - 1];
    router.push(`?profile=${previousProfile.slug}`, {scroll: false});
  };

  const handleNextProfile = () => {
    if(isLastProfile) return;

    const nextProfile = allProfiles[currentProfileIndex + 1];
    router.push(`?profile=${nextProfile.slug}`, {scroll: false });
  };

  // React.useEffect(()=>{
  //   setEditMode(false);
  // },[activeTab])
  return (
    <Grid container size={12} px={1} mt={2} justifyContent="center">
      <ProfileTabs
        profiles={
          profiles?.filter?.((profile) => Number(profile.status) > 0) || []
        }
        query={query}
        onChange={(e) => {
          console.log(e);
          router.push(`?profile=${e}`, { scroll: false });
          // setEditMode(false);
        }}
      />
      <Grid container size={12} justifyContent="center" mt={2}>
        <Grid
          size={{ xs: 11, md: 10 }}
           sx={{
            bgcolor: (theme) => theme.palette.cardbg.main, 
            color: (theme) => theme.palette.cardtext.main, 
            borderRadius: 2.5, 
            boxShadow: 1,
            height: "calc(90vh - 160px)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Grid
            container
            size={12}
            justifyContent="space-between"
            alignItems="center"
            sx={{
              py: 1.5,
              px: 2,
              color: "white",
              bgcolor: (theme) => theme.palette.primary.main,
              fontWeight: 600,
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
            }}
          >
            <Typography
              fontSize={16}
              fontWeight={600}
              textTransform="capitalize"
            >
              {selectedProfile?.name}
            </Typography>
            <Page.Box display="flex" alignItems="center" gap={2}>
              <Typography fontSize={16}>
                {1}/{selectedProfile?.pages?.length ?? ""}
              </Typography>
              {!editMode && (
                <Button
                  endIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                  sx={{
                    color: "white",
                    p: 0,
                    fontSize: 15,
                    textTransform: "none",
                    ml: 1,
                  }}
                >
                  Update
                </Button>
              )}
            </Page.Box>
          </Grid>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Survey
              editMode={editMode}
              setEditMode={setEditMode}
              hideSteps={true}
              isProfile={true}
              survey={selectedProfile}
              start={0}
              user={user}
              endpage={"/api/v1/me/profile"}
              onComplete={(e) => {
                setEditMode(false);
              }}
            />
          </Box>
          
          {!editMode && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 2,
                py: 1,
                flexShrink: 0,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<KeyboardArrowLeft />}
                onClick={handlePreviousProfile}
                disabled={isFirstProfile}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                Back
              </Button>

              <Button
                variant="contained"
                color="primary"
                endIcon={<KeyboardArrowRight />}
                onClick={handleNextProfile}
                disabled={isLastProfile}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                Next
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
}
function ProfileTabs({ profiles, query, onChange }) {
  const tabs = React.useMemo(() => {
    return profiles.map((p) => ({
      label: p.name,
      icon: p.icon,
      link: p.slug,
      status: p.status,
    }));
  }, [profiles]);

  const activeTab = React.useMemo(() => {
    if (!profiles || !(profiles instanceof Array) || profiles.length === 0)
      return -1;
    if (!query.profile) return -1;
    return profiles.map((p) => p.slug).indexOf(query.profile);
  }, [profiles, query]);

  React.useEffect(() => {
    if (!tabs.length) return;
    if (!query.profile) {
      onChange(tabs[0].link);
    }
  }, [tabs, query.profile]);
  return (
    <Tabs
      value={activeTab}
      onChange={(_, v) => {
        onChange(tabs[v].link);
      }}
      variant="scrollable"
      scrollButtons
      allowScrollButtonsMobile
      sx={{
        width: "100%",
        pb: 0.3,
        borderBottom: "3px solid whitesmoke",
        "& .MuiTabs-scrollButtons .MuiSvgIcon-root": { fontSize: 30 },
        "& .MuiTabs-indicator": {
          bgcolor: (theme) => theme.palette.primary.main,

          height: 3,
          display: "none",
        },
        "& .MuiTab-root": {
          color: "black",
          fontSize: { xs: 14, md: 16 },
          fontWeight: 600,
        },
        "& .Mui-selected": {
          bgcolor: (theme) => theme.palette.primary.main,
          color: "white !important",
        },
      }}
    >
      {tabs.map(
        (tab, i) =>
          Number(tab.status) > 0 && (
            <Tab
              key={tab.label}
              sx={{ borderRadius: 2, m: 0.5, border: "2px solid whitesmoke" }}
              label={
                <TabLabel
                  label={tab.label}
                  icon={tab.icon}
                  selected={activeTab === i}
                  progress={tab.status}
                />
              }
            />
          ),
      )}
    </Tabs>
  );
}

/* ---------------------------------------------------------------------------------------------------------
   Profiles page, "Rewards Club" design. Same data and logic as ClassicProfiles above (same profile API call,
   same ?profile=<slug> link); only the look changed. Add ?classic=1 to the address to open the previous design.

   What the member sees (ps/profileRules.js): Basic, Education, Professional and Financial first, then the other profiles
   below them. Those others cannot be opened until the basics are complete: clicking one shows a short message instead.
   Points and quality score: the API pays them when a profile is completed and stores them in the database; this page only
   reads them (GET /api/v1/me/points) and tells the other screens to read them again (bumpRewards, user.Reload).
   --------------------------------------------------------------------------------------------------------- */
// The other profiles follow the member's sign-up interests; a profile that is already started is always listed (status > 0).
// Use 0 to also list every profile the member has not started when they picked interests.
const MIN_STATUS = 0;
const fetchProfileList = (category) => api.post("/api/v1/profile", { category }).then((r) => r.data);

function SkinProfiles() {
  const [user, query, router, pathname, qc] = [useMember(), useQueryParameters(), useRouter(), usePathname(), useQueryClient()];
  // Adults / Under 18 is decided at sign-up (date of birth -> user.category) and the profile API returns that set.
  const cat = user?.category === "minor" ? "minor" : "b2c";
  const profileKey = ["profiles", user?.category, "false"];
  const fetchProfiles = React.useCallback(() => fetchProfileList(user.category), [user?.category]);
  const { data: profiles = [], isLoading } = useQuery({ queryKey: profileKey, queryFn: fetchProfiles });
  // the interests the member ticked at sign-up (saved as the answer "interests"); decide which other profiles are listed
  const { data: interests = [], isLoading: interestsLoading } = useQuery({
    queryKey: ["ps-interests", user?._id],
    queryFn: () => api.post("/api/v1/me", { questions: ["interests"] }).then((r) => normalizeInterests(r?.data?.interests)),
    enabled: Boolean(user?._id),
  });
  // the member's rewards as the database holds them: profileRewards, profilePoints, pointsPerProfile (null when the call fails)
  const pointsKey = ["ps-points", user?._id];
  const fetchPoints = React.useCallback(() => api.get("/api/v1/me/points").then((r) => (r?.status === "error" ? null : r?.data ?? null)), []);
  const { data: points, isFetched: pointsFetched } = useQuery({ queryKey: pointsKey, queryFn: fetchPoints, enabled: Boolean(user?._id), retry: false });
  const visible = React.useCallback((list) => visibleProfiles(Array.isArray(list) ? list : [], interests, MIN_STATUS), [interests]);
  const shown = React.useMemo(() => visible(profiles), [profiles, visible]);

  // ---- the basics first: the other profiles open only when Basic, Education, Professional and Financial are complete
  const unlocked = React.useMemo(() => basicsDone(profiles), [profiles]);
  const isLocked = (slug) => !unlocked && !isCore(slug);
  const [notice, setNotice] = React.useState(null); // { text, id } - the same pill the design uses for its messages
  const noticeTimer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(noticeTimer.current), []);
  const askBasicsFirst = (p) => {
    const first = nextBasic(profiles);
    const text = first ? `Complete ${first.name} first to open ${p?.name || "this profile"}.` : "Complete your basic profiles first.";
    setNotice({ text, id: Date.now() });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3400);
  };
  // a link such as ?profile=travel while the basics are open: back to the hub with the message
  const blockedLink = Boolean(query.profile) && !isLoading && !interestsLoading && isLocked(query.profile);
  React.useEffect(() => {
    if (!blockedLink) return;
    askBasicsFirst(profiles.find((p) => p.slug === query.profile));
    router.replace(pathname, { scroll: false });
  }, [blockedLink]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Quality Score: +1 for every completed profile, once per profile.
  // The profiles already counted are kept in the database as the answer "quality-credited" (PATCH /api/v1/me/answer), so a profile is never
  // counted twice (not on another device, not after a reload). The new score is written with PUT /api/v1/me.
  const qualityBusy = React.useRef(false);
  const creditQuality = React.useCallback(async (list) => {
    if (qualityBusy.current || !Array.isArray(list)) return;
    qualityBusy.current = true;
    try {
      const done = list.filter((p) => Number(p?.status) >= 100).map((p) => p.slug);
      if (!done.length) return;
      const me = await api.post("/api/v1/me", { questions: ["quality-credited"] }).then((r) => r?.data);
      if (!me) return;
      const counted = [].concat(me["quality-credited"] ?? []).filter(Boolean);
      const add = done.filter((s) => !counted.includes(s));
      if (!add.length) return;
      const score = Math.min(200, (Number(me.qualityScore) || 0) + add.length);
      const saved = await api.put("/api/v1/me", { qualityScore: score });
      if (saved?.status === "error") return;
      await api.patch("/api/v1/me/answer", { "quality-credited": [...counted, ...add] });
      user?.Reload?.(); // the header / My Account read the new Quality Score
    } catch (e) {
      console.log(e);
    } finally {
      qualityBusy.current = false;
    }
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps
  // ---- Prize Machine: capsules = the profiles listed; which of them are won = the rewards the database holds
  const [rewardsReady, setRewardsReady] = React.useState(false);
  const applyRewards = React.useCallback((all, pts) => {
    const list = Array.isArray(all) ? all : [];
    setProfileNames(list);
    setRewardData({ uid: user?._id, cat, profiles: visible(list), completed: list, points: pts });
  }, [user?._id, cat, visible]);
  React.useEffect(() => {
    if (!Array.isArray(profiles) || isLoading || interestsLoading || !pointsFetched) return;
    applyRewards(profiles, points);
    creditProfileRewards(user, profiles).then((n) => { if (n) bumpRewards(); }).catch(() => {}); // completed profiles without a reward yet are paid once
    creditQuality(profiles); // profiles that were already complete are counted once
    setRewardsReady(true); // the machine is built only now, so it never starts empty
  }, [applyRewards, creditQuality, profiles, points, isLoading, interestsLoading, pointsFetched, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps
  // called by the flow right after a profile was saved: the API has just paid its points and raised the quality score
  const afterSave = React.useCallback(async () => {
    const fresh = await qc.fetchQuery({ queryKey: profileKey, queryFn: fetchProfiles, staleTime: 0 });
    const pts = await qc.fetchQuery({ queryKey: pointsKey, queryFn: fetchPoints, staleTime: 0 });
    applyRewards(fresh, pts);
    await creditProfileRewards(user, fresh).catch(() => 0); // the profile just completed pays its points into the database (PUT /api/v1/rewards)
    bumpRewards(); // sidebar, dashboard and My Account read the new Reward Balance
    await creditQuality(fresh); // +1 Quality Score for every newly completed profile (also reloads the user)
    user?.Reload?.(); // the header reads the new Quality Score
  }, [qc, fetchProfiles, fetchPoints, applyRewards, creditQuality, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (p) => (isLocked(p.slug) ? askBasicsFirst(p) : router.push(`?profile=${p.slug}`, { scroll: false }));
  const hub = () => router.push(pathname, { scroll: false });
  if (isLoading || interestsLoading) return <></>;
  const current = query.profile && !isLocked(query.profile) ? shown.find((p) => p.slug === query.profile) : null;
  const at = current ? shown.indexOf(current) : -1;
  const next = at >= 0 ? shown[at + 1] : null;
  return (
    <div className="ps" style={{ minHeight: "calc(100vh - 70px)", overflowX: "hidden" }}>
      {current ? (
        <PsFlow
          key={current.slug}
          survey={current}
          user={user}
          endpage="/api/v1/me/profile"
          onHub={hub}
          onSaved={afterSave}
          hasNext={Boolean(next) && !isLocked(next.slug)}
          onNextProfile={() => next && open(next)}
        />
      ) : (
        <PsHub profiles={shown} onOpen={open} cat={cat} rewardsReady={rewardsReady} />
      )}
      {notice ? (
        <div className="toasts" role="status" aria-live="polite">
          <div className="toast" key={notice.id}>{notice.text}</div>
        </div>
      ) : null}
    </div>
  );
}

export default function ProfilesPage() {
  const query = useQueryParameters();
  // ?classic=1 opens the previous design and stays on it (the old page changes the address itself, which would
  // otherwise drop the flag); ?classic=0 goes back to the new design.
  const [classic, setClassic] = React.useState(false);
  React.useEffect(() => {
    try {
      if (query.classic === "1") sessionStorage.setItem("profiles-classic", "1");
      if (query.classic === "0") sessionStorage.removeItem("profiles-classic");
      setClassic(sessionStorage.getItem("profiles-classic") === "1");
    } catch {
      setClassic(query.classic === "1");
    }
  }, [query.classic]);
  return classic ? <ClassicProfiles /> : <SkinProfiles />;
}
