"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  IconButton,
  Avatar,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Collapse,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";

import DataCards from "@/components/DataCards";

import { loadData, api } from "@/util";
import { SurveyPoints } from "../../components";
import { SurveyHistory } from "../dashboard/page";
import { useQuery, useMember } from "@/Context";
import useCompletedProfiles from "@/hooks/useCompletedProfiles";
import useProfileGate from "@/hooks/useProfileGate";
import { isHighReward } from "../profiles/ps/profileRules";
import WorldTile from "../profiles/ps/WorldTile"; // the profile card of the Profiles page
import GateDialog from "../profiles/ps/GateDialog"; // the pop-up of a locked card: what to finish first
//import {useTourActive} from "@/hooks/useTourActive";
//import mockSurveys from "@/mockData/surveys"

const permittedStatus = ["invited", "dropout"];

// "High Reward" and "Short Surveys" split every card by its points: more than 50 = High Reward, 50 or fewer = Short Surveys.
// The points come from the database (the admin), for the profiles taken as surveys and for real surveys alike.
const inTab = (row, tab) => (tab === "high") === isHighReward(row.points);
export default function SurveyDashboard() {
  const [query] = [useQuery()];
  const member = useMember();
  const doneProfiles = useCompletedProfiles(member?.category); // a survey whose profile is already complete is not shown again
  const [surveys, setSurveys] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    setIsLoading(true);
    loadData(
      api.post(`/api/v1/me/survey`, { source: query.source, status: "active" }),
      (resp) => {
        setSurveys(resp.data);
      },
      () => {
        setIsLoading(false);
      },
    );
  }, [query]);
  // Order of the member's journey: Basic, Education, Professional and Financial (Profiles page). Once those four are complete,
  // the other profiles and the surveys are all open together (see hooks/useProfileGate.js).
  const gate = useProfileGate();
  const visibleSurveys = (surveys || []).filter((s) => !doneProfiles.includes(String(s?.slug || "").toLowerCase()));
  const isProfileSurvey = (s) => gate.profileSlugs.has(String(s?.slug || "").toLowerCase());
  // The list: the profiles still to complete first (the same cards as the Profiles page), then the surveys. Both come from the database.
  const profileRows = gate.pending.map((p) => ({ _id: p._id, slug: p.slug, name: p.name, points: p.points, loi: p.loi, questions: p.questions, kind: "profile", participationStatus: "invited" }));
  const normalSurveys = visibleSurveys.filter((s) => !isProfileSurvey(s));
  const surveysLocked = gate.loading || !gate.coreDone; // surveys open as soon as the four basic profiles are complete
  const listRows = [...profileRows, ...normalSurveys.map((s) => ({ ...s, kind: "survey" }))];
  const availableSurveys = visibleSurveys.filter((s) =>
    permittedStatus.includes(s.participationStatus),
  );
  const stats = [
    {
      title: "Available Surveys",
      value: availableSurveys?.length,
      subtitle: "Surveys",
      icon: <AssignmentOutlinedIcon />,
      color: "#3B82F6",
      bg: "#EFF6FF",
    },
    {
      title: "Total Earning Opportunity",
      value:
        availableSurveys.length === 0
          ? `-`
          : `${availableSurveys?.reduce((sum, survey) => sum + survey.points, 0)} pts`,
      subtitle: "Across all surveys",
      icon: <AccountBalanceWalletOutlinedIcon />,
      color: "#16A34A",
      bg: "#ECFDF3",
    },
    {
      title: "Estimated Time",
      value:
        availableSurveys.length === 0
          ? `-`
          : `${Math.round(availableSurveys?.reduce((sum, survey) => sum + survey.loi, 0) / availableSurveys?.length)} min`,
      subtitle: "On average",
      icon: <AccessTimeOutlinedIcon />,
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
    {
      title: "Average Reward",
      value:
        availableSurveys.length === 0
          ? `-`
          : `${Math.round(availableSurveys?.reduce((sum, survey) => sum + survey.points, 0) / availableSurveys?.length)} pts`,
      subtitle: "Per survey",
      icon: <CardGiftcardOutlinedIcon />,
      color: "#F59E0B",
      bg: "#FFFBEB",
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, md: 2.5 }, bgcolor: "#eff3f5" }}>
      <Collapse
        in={availableSurveys.length !== 0 && !isLoading}
        timeout="auto"
        unmountOnExit
      >
        <SurveyStat stats={stats} isLoading={isLoading} />
        <Divider sx={{ mt: 2, mb: 1, bgcolor: "#ffe" }} />
      </Collapse>
      <SurveyList surveys={listRows} query={query} isLoading={isLoading || gate.loading} gate={gate} surveysLocked={surveysLocked} />
      <Divider sx={{ my: 2, bgcolor: "#ffe" }} />
      <SurveyHistory />
    </Box>
  );
}

function SurveyStat({ stats, isLoading }) {
  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={2}
      >
        <Grid sx={{ flex: 1 }}>
          <Grid container spacing={3}>
            {stats.map((item, index) => (
              <Grid
                key={index}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4,
                  lg: 3,
                }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    position: "relative",
                    minHeight: 120,
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    {isLoading ? (
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          display: "inline-flex",
                          zIndex: 10,
                        }}
                      >
                        <CircularProgress
                          sx={{ color: "primary.main" }}
                          thickness={2}
                        />
                      </Box>
                    ) : (
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="flex-start"
                      >
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: item.bg,
                            color: item.color,
                          }}
                        >
                          {item.icon}
                        </Avatar>

                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={600}
                            mb={1}
                          >
                            {item.title}
                          </Typography>

                          <Typography variant="h5" fontWeight={700}>
                            {item.value}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mt={0.5}
                          >
                            {item.subtitle}
                          </Typography>
                        </Box>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}

function SurveyList({ surveys, query, isLoading, gate, surveysLocked }) {
  const router = useRouter();
  const [gateOpen, setGateOpen] = React.useState(false); // a locked card was pressed
  const [activeFilter, setActiveFilter] = React.useState(
    !query.filter || query.filter === "null" || query.filter === "undefined"
      ? "All New Surveys"
      : query.filter,
  );
  console.log(activeFilter);
  const filters = [
    {
      label: "All New Surveys",
      badge: "New",
    },
    {
      label: "High Reward Surveys",
      filter: (survey) => inTab(survey, "high"),
    },
    {
      label: "Short Surveys",
      filter: (survey) => inTab(survey, "short"),
    },
    // {
    //   label: "New Surveys",
    //   badge: "New",
    //   filter: (survey) => survey.participationStatus === "invited",
    // },
  ];

  return (
    <Box>
      <DataCards
        data={surveys}
        isLoading={isLoading}
        filter={filters.find((filter) => filter.label === activeFilter)}
        pageSize={12}
        getSearchText={(row) => row.name}
        renderToolbar={() => (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              width: "100%",
              alignItems: "center",
            }}
          >
            {filters.map((filter) => {
              const active = activeFilter === filter.label;

              return (
                <Button
                  key={filter.label}
                  variant={active ? "contained" : "outlined"}
                  color={active ? "secondary" : "inherit"}
                  onClick={() => setActiveFilter(filter.label)}
                  sx={{
                    height: 34,
                    px: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    borderColor: "divider",
                    bgcolor: active ? "primary.main" : "#fff",
                    color: active ? "#fff" : "text.primary",
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: 1,
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={700}>
                      {filter.label}
                    </Typography>

                    {filter.badge && (
                      <Chip
                        label={filter.badge}
                        size="small"
                        color="success"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#fff",
                          background:
                            "linear-gradient(45deg, #00c853, #64dd17)",
                        }}
                      />
                    )}
                  </Stack>
                </Button>
              );
            })}
          </Box>
        )}
        card={(row, index) => <SurveyTile row={row} gate={gate} surveysLocked={surveysLocked} router={router} onLocked={() => setGateOpen(true)} />}
        cardProps={{
          elevation: 0,
          sx: {
            mt: 1,
            overflow: "visible",
            bgcolor: "transparent",
            boxShadow: "none",
            "&:hover": { transform: "none" },
          },
        }}
      />
      <GateDialog
        open={gateOpen}
        gate={gate}
        onClose={() => setGateOpen(false)}
        onStart={(slug) => { setGateOpen(false); router.push(`/member/profiles?profile=${slug}`); }}
      />
    </Box>
  );
}

// One card of the list, in the design of the Profiles page (WorldTile).
//  - a profile: opens the profile form once the four basics are complete (until then it is locked)
//  - a survey: opens the survey once the four basics are complete (until then it is locked)
function SurveyTile({ row, gate, surveysLocked, router, onLocked }) {
  if (row.kind === "profile") {
    const locked = !gate.coreDone;
    return (
      <WorldTile
        slug={row.slug}
        name={row.name}
        meta={`${row.questions} questions`}
        pill="Start"
        points={row.points}
        locked={locked}
        title={locked ? "Complete your Basic, Education, Professional and Financial profiles first" : undefined}
        onClick={() => (locked ? onLocked() : router.push(`/member/profiles?profile=${row.slug}`))}
      />
    );
  }
  const canStart = permittedStatus.includes(row.participationStatus);
  return (
    <WorldTile
      slug={row.slug}
      name={row.name}
      meta={`${row.loi} min`}
      pill="Start"
      points={row.points}
      locked={surveysLocked}
      title={surveysLocked ? "Complete your Basic, Education, Professional and Financial profiles first" : undefined}
      onClick={() => {
        if (surveysLocked) return onLocked();
        if (canStart) router.push(`/survey?name=${row.slug}`);
      }}
    />
  );
}