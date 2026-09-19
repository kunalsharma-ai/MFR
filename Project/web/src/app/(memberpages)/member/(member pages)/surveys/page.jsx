"use client";

import React from "react";
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

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import DataCards from "@/components/DataCards";

import { loadData, api } from "@/util";
import { SurveyPoints } from "../../components";
import { SurveyHistory } from "../dashboard/page";
import { useQuery } from "@/Context";
//import {useTourActive} from "@/hooks/useTourActive";
//import mockSurveys from "@/mockData/surveys"

const permittedStatus = ["invited", "dropout"];
export default function SurveyDashboard() {
  const [query] = [useQuery()];
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
  const availableSurveys = surveys?.filter((s) =>
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
      <SurveyList surveys={surveys} query={query} isLoading={isLoading} />
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

function SurveyList({ surveys, query, isLoading }) {
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
      filter: (survey) => survey.points > 1500,
    },
    {
      label: "Short Surveys",
      filter: (survey) => survey.loi < 15,
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
        card={(row) => <SurveyCard survey={row} />}
        cardProps={{
          elevation: 0,
          sx: {
            mt: 1,
            borderRadius: "24px",
          },
        }}
      />
    </Box>
  );
}
function SurveyCard({ survey }) {
  const getCategoryData = (survey) => {
    const categories = [
      {
        name: "basic",
        icon: "fa-id-card-clip",
        gradient: "linear-gradient(180deg, #3b82f6 0%, #1e3a8a 100%)",
      },

      {
        name: "professional",
        icon: "fa-user-tie",
        gradient: "linear-gradient(180deg, #475569 0%, #0f172a 100%)",
      },

      {
        name: "educational",
        icon: "fa-graduation-cap",
        gradient: "linear-gradient(180deg, #8b5cf6 0%, #4c1d95 100%)",
      },

      {
        name: "Survey and Rewards",
        icon: "fa-clipboard-list",
        gradient: "linear-gradient(180deg, #22c55e 0%, #166534 100%)",
      },

      {
        name: "financial",
        icon: "fa-circle-dollar-to-slot",
        gradient: "linear-gradient(180deg, #f59e0b 0%, #b45309 100%)",
      },

      {
        name: "parenting",
        icon: "fa-people-roof",
        gradient: "linear-gradient(180deg, #ec4899 0%, #9d174d 100%)",
      },

      {
        name: "Home and Pet Ownership",
        icon: "fa-house-chimney",
        gradient: "linear-gradient(180deg, #f97316 0%, #9a3412 100%)",
      },

      {
        name: "shopping",
        icon: "fa-cart-shopping",
        gradient: "linear-gradient(180deg, #ff2d55 0%, #be185d 100%)",
      },

      {
        name: "Lifestyle and food",
        icon: "fa-utensils",
        gradient: "linear-gradient(180deg, #fb923c 0%, #9a3412 100%)",
      },

      {
        name: "travel",
        icon: "fa-plane-departure",
        gradient: "linear-gradient(180deg, #ff9800 0%, #ea580c 100%)",
      },

      {
        name: "automobile",
        icon: "fa-car-side",
        gradient: "linear-gradient(180deg, #64748b 0%, #1e293b 100%)",
      },

      {
        name: "health",
        icon: "fa-heart-pulse",
        gradient: "linear-gradient(180deg, #10b981 0%, #065f46 100%)",
      },

      {
        name: "beauty & fashion",
        icon: "fa-hand-dots",
        gradient: "linear-gradient(180deg, #d946ef 0%, #86198f 100%)",
      },

      {
        name: "media, electronics, mobile & technology",
        icon: "fa-microchip",
        gradient: "linear-gradient(180deg, #2563eb 0%, #312e81 100%)",
      },

      {
        name: "sports",
        icon: "fa-basketball",
        gradient: "linear-gradient(180deg, #f59e0b 0%, #b45309 100%)",
      },

      {
        name: "gaming",
        icon: "fa-gamepad",
        gradient: "linear-gradient(180deg, #8b5cf6 0%, #4c1d95 100%)",
      },

      {
        name: "entertainment",
        icon: "fa-film",
        gradient: "linear-gradient(180deg, #ef4444 0%, #7f1d1d 100%)",
      },

      {
        name: "social media",
        icon: "fa-hashtag",
        gradient: "linear-gradient(180deg, #06b6d4 0%, #164e63 100%)",
      },

      {
        name: "music",
        icon: "fa-music",
        gradient: "linear-gradient(180deg, #6366f1 0%, #312e81 100%)",
      },

      {
        name: "environment",
        icon: "fa-leaf",
        gradient: "linear-gradient(180deg, #22c55e 0%, #14532d 100%)",
      },

      {
        name: "real estate",
        icon: "fa-building",
        gradient: "linear-gradient(180deg, #0ea5e9 0%, #0c4a6e 100%)",
      },

      {
        name: "telecom",
        icon: "fa-signal",
        gradient: "linear-gradient(180deg, #14b8a6 0%, #134e4a 100%)",
      },

      {
        name: "insurance",
        icon: "fa-shield-halved",
        gradient: "linear-gradient(180deg, #0284c7 0%, #082f49 100%)",
      },

      {
        name: "employment",
        icon: "fa-briefcase",
        gradient: "linear-gradient(180deg, #6366f1 0%, #3730a3 100%)",
      },

      {
        name: "dating",
        icon: "fa-heart",
        gradient: "linear-gradient(180deg, #fb7185 0%, #9f1239 100%)",
      },

      {
        name: "fitness",
        icon: "fa-dumbbell",
        gradient: "linear-gradient(180deg, #f97316 0%, #7c2d12 100%)",
      },

      {
        name: "crypto",
        icon: "fa-bitcoin-sign",
        gradient: "linear-gradient(180deg, #f59e0b 0%, #78350f 100%)",
      },

      {
        name: "news",
        icon: "fa-newspaper",
        gradient: "linear-gradient(180deg, #38bdf8 0%, #075985 100%)",
      },

      {
        name: "movies",
        icon: "fa-clapperboard",
        gradient: "linear-gradient(180deg, #a855f7 0%, #581c87 100%)",
      },

      {
        name: "kids",
        icon: "fa-baby",
        gradient: "linear-gradient(180deg, #f472b6 0%, #831843 100%)",
      },
    ];
    const surveyCategory = survey.surveyCategory || "";

    return (
      categories.find(
        (cat) =>
          surveyCategory.toLowerCase().includes(cat.name.toLowerCase()) ||
          cat.name.toLowerCase().includes(surveyCategory.toLowerCase()),
      ) || {
        icon: "fa-clipboard-list",
        gradient: "linear-gradient(180deg, #7c3aed 0%, #4338ca 100%)",
      }
    );
  };

  // return categories[Math.floor(Math.random() * 20)];

  const category = getCategoryData(survey);

  return (
    <Box
      sx={{
        height: "100%",
        borderRadius: "24px",
        overflow: "hidden",
        background: category.gradient,
        color: "#fff",
        position: "relative",
        minHeight: 430,

        transform: "translateZ(0)",

        boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",

        "&:hover": {
          transform: "translate3d(0,-4px,0)",
          boxShadow: "0 20px 45px rgba(0,0,0,0.24)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.18), transparent 35%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Chip
            label={
              survey.participationStatus === "invited"
                ? "NEW"
                : survey.participationStatus
            }
            size="small"
            sx={{
              bgcolor:
                survey.participationStatus === "complete"
                  ? "success.main"
                  : survey.participationStatus === "dropout"
                    ? "error.main"
                    : "rgba(255,255,255,0.2)",
              color: "#fff",
              fontWeight: 700,
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.15)",
              textTransform: "uppercase",
            }}
          />
        </Stack>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
            mb: 3,
          }}
        >
          <Avatar
            sx={{
              width: 82,
              height: 82,
              bgcolor: "rgba(255,255,255,0.16)",
              color: "#fff",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <i
              className={`fa-solid ${category.icon}`}
              style={{ fontSize: 32 }}
            />
          </Avatar>
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Typography
            fontWeight={800}
            fontSize={24}
            lineHeight={1.25}
            sx={{
              minHeight: 64,
            }}
          >
            {survey.name}
          </Typography>

          <Typography
            sx={{
              opacity: 0.8,
              mt: 1,
              fontSize: 14,
            }}
          >
            Complete the survey and earn rewards instantly
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 4,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: 42,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {survey.points}
          </Typography>

          <Typography
            sx={{
              mt: 1,
              fontSize: 15,
              fontWeight: 700,
              opacity: 0.85,
            }}
          >
            Reward Points{" "}($ {survey.points / 1000})
          </Typography>
        </Box>

        <Stack
          direction="row"
          justifyContent="center"
          spacing={3}
          sx={{
            mt: 4,
            opacity: 0.92,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />

            <Typography fontWeight={700} fontSize={14}>
              {survey.loi} min
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} />

            <Typography fontWeight={700} fontSize={14}>
              Fast Reward
            </Typography>
          </Stack>
        </Stack>

        <Box sx={{ mt: "auto", pt: 4 }}>
          {permittedStatus.includes(survey?.participationStatus) && (
            <Button
              fullWidth
              variant="contained"
              href={`/survey?name=${survey.slug}`}
              sx={{
                height: 52,
                borderRadius: 3,
                bgcolor: "#fff",
                color: "#4c1d95",
                fontWeight: 800,
                textTransform: "none",
                fontSize: 16,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#f8fafc",
                  boxShadow: "none",
                },
              }}
            >
              Start Survey →
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
