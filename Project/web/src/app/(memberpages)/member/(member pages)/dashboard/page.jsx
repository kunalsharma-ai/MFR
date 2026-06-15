"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Grid,
  Typography,
  CircularProgress,
} from "@mui/material";

import { useMember, useQuery } from "@/Context";
import { Datatable } from "@/components";
import { DateRangeSelector } from "@/components/Form";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";
import { api, loadData, Page } from "@/util";
import { useToast } from "@/hooks";
import {
  SurveyPoints,
  CurrentUser,
} from "@/app/(memberpages)/member/components";

import {
  Poll as PollIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Stars as StarsIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
} from "@mui/icons-material";

const formatNumber = (value) =>
  Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function page() {
  const user = [];
  const router = useRouter();
  const [[threshold, setThreshold], [conversionRate, setConversionRate]] = [
    React.useState(15000),
    React.useState(0.001),
  ];
  function onPointsUpdate(data) {
    setThreshold(data.threshold);
    setConversionRate(data.conversionRate);
  }
  if (!user) return <LoadingOverlay />;
  return (
    <Grid
      container
      size={12}
      sx={{
        bgcolor: "#f4f6fa",
        minHeight: "100vh",
        p: { xs: 2, sm: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 3, md: 4 },
      }}
    >
      <Grid
        size={12}
        container
        sx={{
          display: { xs: "flex", lg: "none" },
          borderRadius: "16px",
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 246, 255, 0.95) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          boxShadow: "0 4px 30px rgba(12, 90, 219, 0.03)",
          px: { xs: 3, md: 4 },
          py: { xs: 2.5, md: 3 },
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "6px",
            height: "100%",
            background: "linear-gradient(180deg, #0c5adb 0%, #063686 100%)",
          },
        }}
      >
        <CurrentUser />
        <SurveyPoints onUpdate={onPointsUpdate} />
      </Grid>
      <Stats threshold={threshold} conversionRate={conversionRate} />
      <Surveys />
      <Grid
        size={12}
        px={{ xs: 2, md: 3 }}
        py={2}
        justifyContent="center"
        sx={{ border: `1px solid #e0e0e0` }}
      >
        <SurveyHistory />
      </Grid>
    </Grid>
  );
}

function Stats({ threshold, conversionRate }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [statistics, setStatistics] = React.useState({});
  React.useEffect(() => {
    setIsLoading(true);
    loadData(
      api.get(`/api/v1/me/statistics`),
      (resp) => {
        if (!resp.data) return useToast(resp);
        let data = resp.data;

        setStatistics(data);
      },
      () => {
        setIsLoading(false);
      },
    );
  }, [threshold, conversionRate]);

  return (
    <Grid size={12}>
      <StatCards
        statistics={statistics}
        isLoading={isLoading}
        conversionRate={conversionRate}
      />
    </Grid>
  );
}

function Surveys() {
  const [user, query, router] = [useMember(), useQuery(), useRouter()];
  const [availableSurveys, setAvailableSurveys] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    setIsLoading(true);
    loadData(
      api.get(`/api/v1/me/survey`),
      (resp) => {
        if (!resp || resp.status === "error") return;
        const { data } = resp;
        setAvailableSurveys(data);
      },
      () => {
        setIsLoading(false);
      },
    );
  }, [user]);

  const surveys = [
    {
      name: "Your Survey",
      link: "/member/surveys?source=internal",
      description:
        "Handpicked opportunities curated specifically around your unique profile insights. Complete these high-value matches to maximize your earnings securely and directly.",
      isAvailable: Boolean(availableSurveys?.internal),
      stat: [
        {
          title: "All New Surveys",
          filter: null,
          count: availableSurveys?.internal?.all ?? 0,
          bg: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        },
        {
          title: "High Reward Surveys",
          filter: "High Reward Surveys",
          count: availableSurveys?.internal?.highRewards ?? 0,
          bg: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
        },
        {
          filter: "Short Surveys",
          title: "Short Surveys",
          count: availableSurveys?.internal?.short ?? 0,
          bg: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
        },
        // {
        //   title: "New Surveys",
        //   filter: "New Surveys",
        //   count: availableSurveys?.internal?.newSurveys ?? 0,
        //   bg: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
        // },
      ],
    },
    {
      name: "Daily Survey",
      link: "/member/surveys?source=external",
      description:
        "High-frequency, rotating questionnaires updated constantly throughout the day. Dive in anytime for quick, continuous chances to boost your daily points balance.",
      isAvailable: Boolean(availableSurveys?.external),
      stat: [
        {
          title: "All New Surveys",
          filter: null,
          count: 0,
          bg: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        },
        {
          title: "High Reward Surveys",
          filter: "High Reward Surveys",
          count: 0,
          bg: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
        },
        {
          filter: "Short Surveys",
          title: "Short Surveys",
          count: 0,
          bg: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
        },
        // {
        //   title: "New Surveys",
        //   filter: "New Surveys",
        //   count: 0,
        //   bg: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
        // },
      ],
    },
  ];

  return (
    <Grid
      size={12}
      container
      spacing={3}
      px={{ xs: 2.5, md: 4 }}
      py={3.5}
      justifyContent="center"
      sx={{
        borderRadius: "16px",
        background: "#ffffff",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        boxShadow: "0 4px 25px rgba(0, 0, 0, 0.02)",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        px={0.5}
        mb={0.5}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: "700",
              color: "primary.main",
              letterSpacing: "-0.5px",
            }}
          >
            Available Surveys
          </Typography>
        </Box>
      </Box>

      {surveys.map((survey, index) => {
        const cardBg =
          index === 0
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            : "linear-gradient(135deg, #1e3a8a 0%, #172554 100%)";

        const cardGlow =
          index === 0 ? "rgba(15, 23, 42, 0.12)" : "rgba(30, 58, 138, 0.12)";

        const hoverGlow =
          index === 0
            ? "0 20px 40px -10px rgba(15, 23, 42, 0.45)"
            : "0 20px 40px -10px rgba(30, 58, 138, 0.45)";

        return (
          <Grid
            container
            key={index}
            size={{ xs: 12, lg: 6 }}
            direction="column"
            alignItems="center"
            justifyContent="center"
            spacing={2}
            p={{ xs: 1, md: 3 }}
            sx={{
              boxShadow: `0 8px 30px ${cardGlow}`,
              background: cardBg,
              borderRadius: "16px",
              color: "#fff",
              overflow: "hidden",
              textAlign: "center",
              minHeight: 310,
              transition:
                "transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
              willChange: "transform",

              position: "relative",
              "&:hover": {
                boxShadow: hoverGlow,
                transform: "translateY(-6px)",
              },
            }}
          >
            {isLoading ? (
              <Page.Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  display: "inline-flex",
                  zIndex: 10,
                }}
              >
                <CircularProgress sx={{ color: "white" }} thickness={2} />
              </Page.Box>
            ) : survey.isAvailable ? (
              <>
                <Typography
                  sx={{
                    fontWeight: "700",
                    fontSize: "22px",
                    letterSpacing: "-0.5px",
                    mb: 1,
                  }}
                >
                  {survey.name}
                </Typography>

                <Typography
                  sx={{
                    fontSize: "14px",
                    px: 2,
                    lineHeight: 1.6,
                    opacity: 0.85,
                    mb: 3,
                    maxWidth: "500px",
                  }}
                >
                  {survey.description}
                </Typography>

                <Grid
                  container
                  spacing={2}
                  justifyContent="center"
                  width="100%"
                  my={1}
                  px={2}
                >
                  {survey.stat.map((item, statIndex) => (
                    <Grid key={statIndex} size={{ xs: 6, sm: 4 }}>
                      <Page.Link
                        href={`${survey.link}&filter=${item.filter}`}
                        sx={{
                          textDecoration: "none",
                          "&:hover": {
                            textDecoration: "none",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            borderRadius: "12px",
                            background: item.bg,
                            color: "#fff",
                            py: 1.5,
                            px: 1,
                            textAlign: "center",
                            cursor: "pointer",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            transition:
                              "all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: "0 12px 24px rgba(0, 0, 0, 0.3)",
                              borderColor: "rgba(255, 255, 255, 0.25)",
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "11px",
                              fontWeight: "700",
                              opacity: 0.9,
                              whiteSpace: "nowrap",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              mb: 0.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.title}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: "24px",
                              fontWeight: "800",
                              lineHeight: 1.1,
                            }}
                          >
                            {item.count}
                          </Typography>
                        </Box>
                      </Page.Link>
                    </Grid>
                  ))}
                </Grid>
              </>
            ) : (
              <Box
                width={"100%"}
                display="flex"
                alignItems="center"
                flexDirection={{ xs: "column", xl: "row" }}
                justifyContent="space-between"
                gap={1}
                mb={2}
                textAlign="center"
                px={3}
                position={"relative"}
                zIndex={2}
              >
                <Box
                  component="img"
                  src={
                    index === 0
                      ? "/images/no-survey.png"
                      : "/images/no-daily-survey.png"
                  }
                  alt="No surveys"
                  sx={{
                    width: 220,
                    maxWidth: "100%",
                    objectFit: "contain",
                    mb: 2,
                    filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.12))",
                  }}
                />

                <Box display="flex" flexDirection="column" alignItems="center">
                  <Typography
                    sx={{
                      fontSize: "20px",
                      fontWeight: 800,
                      lineHeight: 1.1,
                      mb: 1,
                    }}
                  >
                    {index === 0
                      ? "No surveys right now"
                      : "No daily surveys yet"}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "15px",
                      opacity: 0.92,
                      maxWidth: 360,
                      lineHeight: 1.7,
                      mb: 3,
                    }}
                  >
                    {index === 0
                      ? "Keep your profile details updated regularly to unlock more relevant survey opportunities and higher reward matches."
                      : "Quick surveys and earning opportunities will appear throughout the day."}
                  </Typography>

                  {index === 0 && (
                    <Button
                      href="/member/profiles"
                      variant="contained"
                      disableElevation
                      sx={{
                        borderRadius: "14px",
                        px: 3,
                        py: 1,
                        background: "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        color: "#ffffff",
                        fontWeight: 700,
                        textTransform: "none",

                        "&:hover": {
                          background: "rgba(255,255,255,0.24)",
                        },
                      }}
                    >
                      Update Profile
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </Grid>
        );
      })}
    </Grid>
  );
}

export function SurveyHistory() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [user] = [useMember()];
  const [data, setData] = React.useState([]);
  const [dateRange, setDateRange] = React.useState([]);
  React.useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    let filters = {
      status: {
        $nin: ["invited"],
      },
    };
    if (
      Boolean(dateRange) &&
      Boolean(dateRange instanceof Array) &&
      dateRange.length === 2
    )
      filters = { ...filters, dateRange };
    loadData(
      api.post(`/api/v1/response`, filters),
      (resp) => {
        setData(resp?.data);
      },
      () => {
        setIsLoading(false);
      },
    );
  }, [user, dateRange]);

  const renderStatusBadge = (status, source, slug) => {
    if (source === "internal" && status === "dropout") {
      return (
        <Page.Link
          href={`/survey?name=${slug}`}
          sx={{
            display: "inline-block",
            textDecoration: "none",
            bgcolor: "primary.main",
            color: "#fff !important",
            px: 2,
            py: 0.4,
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(12, 90, 219, 0.2)",
            transition: "all 0.25s ease",
            "&:hover": {
              textDecoration: "none",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(12, 90, 219, 0.4)",
              bgcolor: "secondary.main",
            },
          }}
        >
          Continue
        </Page.Link>
      );
    }

    const config = {
      complete: {
        bg: "#e6f4ea",
        color: "#137333",
        border: "rgba(19, 115, 51, 0.15)",
      },
      terminate: {
        bg: "#fce8e6",
        color: "#c5221f",
        border: "rgba(197, 34, 31, 0.15)",
      },
      overquota: {
        bg: "#fef7e0",
        color: "#b06000",
        border: "rgba(176, 96, 0, 0.15)",
      },
      dropout: {
        bg: "#f3f4f6",
        color: "#4b5563",
        border: "rgba(75, 85, 99, 0.15)",
      },
    };

    const style = config[status] || {
      bg: "#f3f4f6",
      color: "#4b5563",
      border: "rgba(75, 85, 99, 0.15)",
    };

    return (
      <Box
        sx={{
          display: "inline-block",
          bgcolor: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          borderRadius: "20px",
          px: 1.8,
          py: 0.4,
          fontSize: "12px",
          fontWeight: "600",
          textTransform: "capitalize",
          textAlign: "center",
        }}
      >
        {status}
      </Box>
    );
  };

  const columns = [
    {
      id: "surveyname",
      label: "Survey Name",
      width: 300,
      render: (info) => (
        <Typography
          sx={{
            fontWeight: "600",
            color: "primary.main",
            fontSize: "14px",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
            maxWidth: 280,
          }}
        >
          {info?.survey?.name}
        </Typography>
      ),
      feature: ["searchable", "sortable", "lockable"],
    },
    {
      id: "start time",
      label: "Start time",
      render: (info) => {
        if (["complete", "terminate", "overquota"].includes(info.status))
          return (
            <Typography sx={{ color: "text.secondary", fontSize: "13px" }}>
              {new Date(info.timeline.start).toLocaleString()}
            </Typography>
          );
        return "";
      },
      feature: ["sortable", "lockable"],
    },
    {
      id: "loi",
      label: "Length of Interview",
      width: 220,
      render: (info) => {
        if (["complete", "terminate", "overquota"].includes(info.status)) {
          const loi = (
            new Date(info.updatedAt) - new Date(info.timeline.start)
          )?.toTime();
          return (
            <Typography sx={{ color: "text.secondary", fontSize: "13px" }}>
              {loi}
            </Typography>
          );
        }
        return "";
      },
      feature: ["sortable", "lockable"],
    },
    {
      id: "status",
      label: "Status",
      render: (info) =>
        renderStatusBadge(info.status, info.source, info.survey?.slug),
      feature: ["filterable", "sortable", "lockable"],
    },
    {
      id: "rewards",
      label: "Rewards",
      render: (info) => {
        const isComplete = info.status === "complete";
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: isComplete ? "#d97706" : "text.disabled",
              }}
            />
            <Typography
              sx={{
                fontWeight: isComplete ? "700" : "500",
                color: isComplete ? "#d97706" : "text.secondary",
                fontSize: "13px",
              }}
            >
              {isComplete ? `${info.points} Points` : "0 Points"}
            </Typography>
          </Box>
        );
      },
    },
  ];

  return (
    <Datatable
      isLoading={isLoading}
      pagination={[10, 20, 50, 100]}
      pageSize={20}
      noDataMsg="No Record Found."
      data={data.filter((info) => info.status !== "invited")}
      hideDownload={true}
      hideColumnSelector
      extra={
        <Box px={{ xs: 0, md: 2 }} my={{ xs: 1, md: 0 }}>
          <DateRangeSelector
            onUpdate={(e) => {
              setDateRange(
                e.map((d) => new Date(d.toDate()).toISOString().split("T")[0]),
              );
            }}
          />
        </Box>
      }
      title={
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: "700",
            color: "primary.main",
            letterSpacing: "-0.5px",
            pb: 0.5,
            my: 1,
          }}
        >
          Survey Participation History
        </Typography>
      }
      columns={columns}
    />
  );
}

const StatCards = ({ statistics, isLoading, conversionRate }) => {
  const iconStyle = {
    className: "card-icon",
    sx: {
      position: "absolute",
      top: 40,
      right: 32,
      fontSize: 48,
      transition:
        "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease",
      transformOrigin: "center",
      opacity: 0.16,
    },
  };

  // const hoverShadowMap = [
  //   "0 20px 35px rgba(79, 70, 229, 0.35)",
  //   "0 20px 35px rgba(5, 150, 105, 0.35)",
  //   "0 20px 35px rgba(220, 38, 38, 0.35)",
  //   "0 20px 35px rgba(217, 119, 6, 0.35)",
  //   "0 20px 35px rgba(2, 132, 199, 0.35)",
  //   "0 20px 35px rgba(219, 39, 119, 0.35)",
  // ];
  const hoverShadowMap = [
    "0 20px 35px rgba(6, 95, 70, 0.45)",
    "0 20px 35px rgba(67, 56, 202, 0.40)",
    "0 20px 35px rgba(190, 24, 93, 0.40)",
    "0 20px 35px rgba(14, 116, 144, 0.40)",
    "0 20px 35px rgba(21, 128, 61, 0.40)",
    "0 20px 35px rgba(180, 83, 9, 0.40)",
  ];

  // const stats = React.useMemo(() => {
  //   return [
  //     {
  //       title: "Survey Participated",
  //       value: formatNumber(statistics?.total ?? 0),
  //       icon: <PollIcon {...iconStyle} />,
  //       background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  //       hideOnLargeScreen: false,
  //     },
  //     {
  //       title: "Survey Completed",
  //       value: formatNumber(statistics?.complete ?? 0),
  //       icon: <CheckCircleIcon {...iconStyle} />,
  //       background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
  //       hideOnLargeScreen: false,
  //     },
  //     {
  //       title: "Survey Disqualified",
  //       value: formatNumber(statistics?.disqualified ?? 0),
  //       icon: <CancelIcon {...iconStyle} />,
  //       background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
  //       hideOnLargeScreen: false,
  //     },
  //     {
  //       title: "Rewards Earned (Points)",
  //       value: `${formatNumber(statistics?.points ?? 0)} Points`,
  //       icon: <StarsIcon {...iconStyle} />,
  //       background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
  //       hideOnLargeScreen: true,
  //     },
  //     {
  //       title: "Rewards Earned",
  //       value: {
  //         usd: `${(Number(statistics?.points ?? 0) * Number(conversionRate)).toMoney("USD")}`,
  //         local: `${(Number(statistics?.points ?? 0) * Number(conversionRate)).toLocalCurrency("USD")}`,
  //       },
  //       icon: <AttachMoneyIcon {...iconStyle} />,
  //       background: "linear-gradient(135deg, #0891b2 0%, #3b82f6 100%)",
  //       hideOnLargeScreen: false,
  //     },
  //     {
  //       title: "Rewards Claimed",
  //       value: {
  //         usd: `${((statistics?.claimed ?? 0) / 100).toMoney("USD")}`,
  //         local: `${((statistics?.claimed ?? 0) / 100).toLocalCurrency("USD")}`,
  //       },
  //       icon: <PaymentsIcon {...iconStyle} />,
  //       background: "linear-gradient(135deg, #be185d 0%, #ec4899 100%)",
  //       hideOnLargeScreen: false,
  //     },
  //   ];
  // }, [statistics, conversionRate]);

  const stats = React.useMemo(() => {
    return [
      {
        title: "Survey Participated",
        value: formatNumber(statistics?.total ?? 0),
        icon: <PollIcon {...iconStyle} />,
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
        hideOnLargeScreen: false,
      },
      {
        title: "Survey Completed",
        value: formatNumber(statistics?.complete ?? 0),
        icon: <CheckCircleIcon {...iconStyle} />,
        background: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
        hideOnLargeScreen: false,
      },
      {
        title: "Survey Disqualified",
        value: formatNumber(statistics?.disqualified ?? 0),
        icon: <CancelIcon {...iconStyle} />,
        background: "linear-gradient(135deg, #831843 0%, #be185d 100%)",
        hideOnLargeScreen: false,
      },
      {
        title: "Rewards Earned (Points)",
        value: `${formatNumber(statistics?.points ?? 0)} Points`,
        icon: <StarsIcon {...iconStyle} />,
        background: "linear-gradient(135deg, #155e75 0%, #0e7490 100%)",
        hideOnLargeScreen: true,
      },
      {
        title: "Rewards Earned",
        value: {
          usd: `${(Number(statistics?.points ?? 0) * Number(conversionRate)).toMoney("USD")}`,
          local: `${(Number(statistics?.points ?? 0) * Number(conversionRate)).toLocalCurrency("USD")}`,
        },
        icon: <AttachMoneyIcon {...iconStyle} />,
        background: "linear-gradient(135deg, #166534 0%, #15803d 100%)",
        hideOnLargeScreen: false,
      },
      {
        title: "Rewards Claimed",
        value: {
          usd: `${((statistics?.claimed ?? 0) / 100).toMoney("USD")}`,
          local: `${((statistics?.claimed ?? 0) / 100).toLocalCurrency("USD")}`,
        },
        icon: <PaymentsIcon {...iconStyle} />,
        background: "linear-gradient(135deg, #92400e 0%, #b45309 100%)",
        hideOnLargeScreen: false,
      },
    ];
  }, [statistics, conversionRate]);

  return (
    <Page.Box
      display="grid"
      gridTemplateColumns={{
        xs: "1fr",
        sm: "repeat(2, 1fr)",
        lg: "repeat(3, 1fr)",
        xl: "repeat(5, 1fr)",
      }}
      sx={{ gap: 3, py: 1 }}
    >
      {stats.map((data, index) => (
        <Grid
          key={index}
          size={12}
          sx={{
            display: data.hideOnLargeScreen
              ? { xs: "block", xl: "none" }
              : "block",
            height: 145,
            position: "relative",
            background: data.background,
            color: "white",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            transition:
              "transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), border-color 0.4s ease",
            willChange: "transform",
            "&:hover": {
              boxShadow:
                hoverShadowMap[index] || "0 20px 32px rgba(0,0,0,0.28)",
              transform: "translateY(-6px) scale(1.02)",
              borderColor: "rgba(255, 255, 255, 0.3)",
              "& .card-icon": {
                transform: "scale(1.3) rotate(5deg)",
                opacity: 0.35,
              },
            },
          }}
        >
          {isLoading ? (
            <Page.Box
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
                sx={{ color: "white" }}
                thickness={2.5}
                size={28}
              />
            </Page.Box>
          ) : (
            <Page.Box
              sx={{
                position: "relative",
                overflow: "hidden",
                height: "100%",
                display: "flex",
                flexDirection: "column-reverse",
                justifyContent: "center",
              }}
            >
              <Page.Box
                sx={{
                  position: "absolute",
                  width: 130,
                  height: 130,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  bottom: -40,
                  right: -40,
                  filter: "blur(10px)",
                }}
              />
              <Page.Box
                sx={{
                  position: "absolute",
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  top: 20,
                  right: 40,
                  filter: "blur(6px)",
                }}
              />

              <Page.Text
                sx={{
                  fontSize: "14px",
                  px: 3,
                  pt: 1.5,
                  fontWeight: "600",
                  letterSpacing: "0.2px",
                  opacity: 0.95,
                }}
              >
                {data.title}
              </Page.Text>

              {data.icon}

              <Page.Box sx={{ px: 3 }}>
                {typeof data.value === "object" ? (
                  <>
                    <Page.Text
                      sx={{
                        fontWeight: "800",
                        fontSize: "28px",
                        lineHeight: 1,
                        textShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
                        letterSpacing: "-1px",
                      }}
                    >
                      {data.value.usd}
                    </Page.Text>

                    <Page.Text
                      sx={{
                        fontWeight: "600",
                        fontSize: "13px",
                        opacity: 0.85,
                        mt: 0.8,
                        lineHeight: 1.1,
                        wordBreak: "break-word",
                      }}
                    >
                      {data.value.local}
                    </Page.Text>
                  </>
                ) : (
                  <Page.Text
                    sx={{
                      fontWeight: "800",
                      fontSize: "34px",
                      marginTop: "8px",
                      lineHeight: 1,
                      letterSpacing: "-1.2px",
                      textShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    {data.value}
                  </Page.Text>
                )}
              </Page.Box>
            </Page.Box>
          )}
        </Grid>
      ))}
    </Page.Box>
  );
};
