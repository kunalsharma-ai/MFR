"use client";
// For a Teen's parent or legal guardian, reached only from our email (api/app/engagement/teens.js):
//   ?reward=<token>[&d=yes|no]  say YES or NO to one learning-reward request (asks to confirm first)
//   ?view=<token>               read-only view of the teen's points, level, badges, activity and reward requests
// Teen Panel members never see money values, so neither does this page. No sign-in; the link is the key.
import React from "react";
import { Box, Button, Container, Typography, Chip, LinearProgress, Alert } from "@mui/material";
import { api } from "@/util";

const P = "/api/v1/engagement-public/guardian";
const when = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");
const fmt = (n) => new Intl.NumberFormat().format(n || 0);
const STATUS = { guardian_pending: "Waiting for your answer", approved: "You said yes", fulfilled: "Sent", rejected: "Not this time, points returned", cancelled: "Cancelled, points returned", requested: "Requested" };
const REASON = {
  invalid: "This link isn't valid. Please use the newest email from MyFrequentRewards.",
  expired: "This link has expired. Your teen can send you a new one from their account.",
  revoked: "A newer link has replaced this one. Please use the newest email.",
  used: "You've already answered this request.",
};
const BADGE = { "first-survey": "First survey", "surveys-10": "10 surveys", "profiles-5": "5 profiles", "streak-7": "7-day streak", "streak-30": "30-day streak", "polls-10": "10 polls", "design-voter": "Design voter", "idea-maker": "Idea maker" };

function Card({ kicker, title, children }) {
  return (
    <Box sx={{ bgcolor: "#f4f6fb", minHeight: "100vh", py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="sm">
        <Box sx={{ bgcolor: "#fff", borderRadius: 4, p: { xs: 3, sm: 5 }, boxShadow: "0 20px 50px rgba(20,30,70,.08)", border: "1px solid #e3e6f2" }}>
          <Typography variant="overline" sx={{ color: "#3b5bdb", fontWeight: 700 }}>{kicker}</Typography>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mt: 1, mb: 2 }}>{title}</Typography>
          {children}
          <Typography variant="body2" sx={{ color: "#8790b0", mt: 3 }}>Questions? Email support@myfrequentrewards.com</Typography>
        </Box>
      </Container>
    </Box>
  );
}

function Reward({ token, pre }) {
  const [d, setD] = React.useState(null);
  const [pick, setPick] = React.useState(pre === "yes" || pre === "no" ? pre : null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(null);
  const [err, setErr] = React.useState("");
  React.useEffect(() => { api.get(`${P}/reward?t=${encodeURIComponent(token)}`).then((r) => setD(r?.data || { ok: false, reason: "invalid" })); }, [token]);
  async function confirm() {
    setBusy(true); setErr("");
    const r = await api.post(`${P}/reward`, { t: token, decision: pick });
    setBusy(false);
    if (r && r.status !== "error") setDone(r.data.status); else setErr(r?.message || "That didn't go through. Please try again.");
  }
  if (!d) return <Card kicker="For parents and legal guardians" title="One moment…"><LinearProgress /></Card>;
  if (!d.ok) return <Card kicker="For parents and legal guardians" title="This link can't be used"><Typography>{REASON[d.reason] || REASON.invalid}</Typography>{d.status ? <Typography sx={{ mt: 1, color: "#4a5170" }}>Current status: {STATUS[d.status] || d.status}</Typography> : null}</Card>;
  if (done) return (
    <Card kicker="For parents and legal guardians" title={done === "approved" ? "Thank you. You said yes" : "Thank you. You said no"}>
      <Typography sx={{ color: "#4a5170" }}>{done === "approved" ? `We'll send ${d.teen.firstName}'s reward and let them know.` : `${d.teen.firstName} gets their points back. We'll let them know.`}</Typography>
    </Card>
  );
  return (
    <Card kicker="For parents and legal guardians" title={`${d.teen.firstName} would like a learning reward`}>
      <Box sx={{ bgcolor: "#f7f8fc", borderRadius: 3, p: 2.5, mb: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{d.reward.title}</Typography>
        {d.reward.subtitle ? <Typography sx={{ color: "#4a5170" }}>{d.reward.subtitle}</Typography> : null}
        <Typography sx={{ color: "#4a5170", mt: 1 }}>{fmt(d.reward.points)} Teen Panel points · asked {when(d.reward.requestedAt)} · reference {d.reward.reference}</Typography>
      </Box>
      {d.status !== "guardian_pending" ? <Alert severity="info">This request is no longer waiting: {STATUS[d.status] || d.status}.</Alert> : (
        <>
          <Typography sx={{ color: "#4a5170", mb: 2 }}>If you say no, {d.teen.firstName} gets the points back. Choose, then confirm.</Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }} role="radiogroup" aria-label="Your answer">
            <Button variant={pick === "yes" ? "contained" : "outlined"} color="success" aria-pressed={pick === "yes"} onClick={() => setPick("yes")} sx={{ borderRadius: 99, textTransform: "none", fontWeight: 700 }}>Yes, this reward is OK</Button>
            <Button variant={pick === "no" ? "contained" : "outlined"} color="error" aria-pressed={pick === "no"} onClick={() => setPick("no")} sx={{ borderRadius: 99, textTransform: "none", fontWeight: 700 }}>No, not this time</Button>
          </Box>
          {err ? <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert> : null}
          <Button variant="contained" disabled={!pick || busy} onClick={confirm} sx={{ borderRadius: 99, textTransform: "none", fontWeight: 700 }}>
            {busy ? "Saving…" : pick ? `Confirm: ${pick === "yes" ? "yes" : "no"}` : "Choose yes or no"}
          </Button>
          <Typography variant="body2" sx={{ color: "#8790b0", mt: 1 }}>This link works until {when(d.expiresAt)}.</Typography>
        </>
      )}
    </Card>
  );
}

function View({ token }) {
  const [d, setD] = React.useState(null);
  React.useEffect(() => { api.get(`${P}/view?t=${encodeURIComponent(token)}`).then((r) => setD(r?.data || { ok: false, reason: "invalid" })); }, [token]);
  if (!d) return <Card kicker="Guardian view" title="One moment…"><LinearProgress /></Card>;
  if (!d.ok) return <Card kicker="Guardian view" title="This link can't be used"><Typography>{REASON[d.reason] || REASON.invalid}</Typography></Card>;
  return (
    <Card kicker="Guardian view · read only" title={`${d.teen.firstName}'s Teen Panel`}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 1.5, mb: 2 }}>
        <Box sx={{ bgcolor: "#f7f8fc", borderRadius: 3, p: 2 }}><Typography variant="body2" sx={{ color: "#4a5170" }}>Points earned</Typography><Typography sx={{ fontWeight: 800, fontSize: 24 }}>{fmt(d.points.earned)}</Typography></Box>
        <Box sx={{ bgcolor: "#f7f8fc", borderRadius: 3, p: 2 }}><Typography variant="body2" sx={{ color: "#4a5170" }}>Level</Typography><Typography sx={{ fontWeight: 800, fontSize: 24 }}>{d.level.level} · {d.level.name}</Typography></Box>
        <Box sx={{ bgcolor: "#f7f8fc", borderRadius: 3, p: 2 }}><Typography variant="body2" sx={{ color: "#4a5170" }}>Best streak</Typography><Typography sx={{ fontWeight: 800, fontSize: 24 }}>{d.streak.best} days</Typography></Box>
      </Box>
      <Typography sx={{ fontWeight: 700, mb: 1 }}>Badges</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        {d.badges.map((b) => <Chip key={b.key} label={`${BADGE[b.key] || b.key}${b.earned ? "" : ` ${b.progress}/${b.target}`}`} color={b.earned ? "success" : "default"} variant={b.earned ? "filled" : "outlined"} />)}
      </Box>
      {d.rewards.length ? (
        <>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Reward requests</Typography>
          <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2 }}>{d.rewards.map((r) => <li key={r.reference}>{r.title} · {fmt(r.points)} points · {STATUS[r.status] || r.status} · {when(r.at)}</li>)}</Box>
        </>
      ) : null}
      <Typography sx={{ fontWeight: 700, mb: 1 }}>Recent activity</Typography>
      {d.activity.length ? (
        <Box component="ul" sx={{ pl: 2, mt: 0 }}>{d.activity.map((a, i) => <li key={i}>{when(a.at)} · {a.name || a.type} · {a.points > 0 ? "+" : ""}{fmt(a.points)} points</li>)}</Box>
      ) : <Typography sx={{ color: "#4a5170" }}>No activity yet.</Typography>}
      <Typography variant="body2" sx={{ color: "#8790b0", mt: 2 }}>This view works until {when(d.expiresAt)}. You can look but not change anything.</Typography>
    </Card>
  );
}

export default function GuardianPage() {
  const [q, setQ] = React.useState(null);
  React.useEffect(() => { setQ(new URLSearchParams(window.location.search)); }, []);
  if (!q) return null;
  if (q.get("reward")) return <Reward token={q.get("reward")} pre={q.get("d")} />;
  if (q.get("view")) return <View token={q.get("view")} />;
  return <Card kicker="For parents and legal guardians" title="This link can't be used"><Typography>{REASON.invalid}</Typography></Card>;
}
