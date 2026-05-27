"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Grid, Typography, Box, Paper } from "@mui/material";
import { useMember } from "@/Context";
import { motion } from "framer-motion";
import {
  People as PeopleIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  AssignmentInd as AssignmentIndIcon,
  Star as StarIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

import { api, Page } from "@/util";
import { useToast } from "@/hooks";

// Motion wrapper for Grid components
const MotionGrid = motion(Grid);

// Animation variants for statistical cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.08,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

// Helper function to return beautiful, tailored category icon, color palettes, and glow effects
const getCategoryDetails = (label = "") => {
  const normalized = label.toLowerCase();

  if (normalized.includes("total") || normalized.includes("panelist")) {
    return {
      icon: <PeopleIcon sx={{ fontSize: 30 }} />,
      lightColor: "rgba(12, 90, 219, 0.12)",
      iconColor: "#0c5adb",
      shadow: "rgba(12, 90, 219, 0.25)",
    };
  }
  if (normalized.includes("survey") || normalized.includes("complete")) {
    return {
      icon: <TrendingUpIcon sx={{ fontSize: 30 }} />,
      lightColor: "rgba(76, 175, 80, 0.12)",
      iconColor: "#2e7d32",
      shadow: "rgba(76, 175, 80, 0.25)",
    };
  }
  if (normalized.includes("category")) {
    return {
      icon: <CategoryIcon sx={{ fontSize: 30 }} />,
      lightColor: "rgba(0, 188, 212, 0.12)",
      iconColor: "#00838f",
      shadow: "rgba(0, 188, 212, 0.25)",
    };
  }
  if (normalized.includes("mho")) {
    return {
      icon: <StarIcon sx={{ fontSize: 30 }} />,
      lightColor: "rgba(233, 30, 99, 0.12)",
      iconColor: "#c2185b",
      shadow: "rgba(233, 30, 99, 0.25)",
    };
  }
  if (
    normalized.includes("points") ||
    normalized.includes("reward") ||
    normalized.includes("sampledge")
  ) {
    return {
      icon: <StarIcon sx={{ fontSize: 30 }} />,
      lightColor: "rgba(255, 152, 0, 0.12)",
      iconColor: "#f57c00",
      shadow: "rgba(255, 152, 0, 0.25)",
    };
  }
  if (
    normalized.includes("disqualified") ||
    normalized.includes("terminate") ||
    normalized.includes("external")
  ) {
    return {
      icon: <CancelIcon sx={{ fontSize: 30 }} />,
      lightColor: "rgba(244, 67, 54, 0.12)",
      iconColor: "#d32f2f",
      shadow: "rgba(244, 67, 54, 0.25)",
    };
  }
  if (normalized.includes("security")) {
    return {
      icon: <ShieldIcon sx={{ fontSize: 30 }} />,
      lightColor: "rgba(96, 125, 139, 0.12)",
      iconColor: "#455a64",
      shadow: "rgba(96, 125, 139, 0.25)",
    };
  }

  // Default matching
  return {
    icon: <AssignmentIndIcon sx={{ fontSize: 30 }} />,
    lightColor: "rgba(0, 150, 136, 0.12)",
    iconColor: "#00796b",
    shadow: "rgba(0, 150, 136, 0.25)",
  };
};

export default function page() {
  const user = useMember();
  const router = useRouter();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: "100%" }}>
      {/* Title & Introduction Section */}
      <Box sx={{ mb: 4, display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "24px", md: "30px" },
            fontWeight: "700",
            color: "text.primary",
            letterSpacing: "-0.5px",
          }}
        >
          Admin Dashboard
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontSize: "14px",
            color: "text.secondary",
          }}
        >
          Real-time metrics, panelists demographics, and activity overview.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Panelists />
        {/* <Surveys /> */}
      </Grid>
    </Box>
  );
}

function Panelists() {
  const [statistics, setStatistics] = React.useState({});
  React.useEffect(() => {
    api
      .get(`/api/v1/user/summarize`)
      .then((resp) => {
        if (!resp.data) return useToast(resp);
        let data = resp.data;
        console.log(data);
        setStatistics(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const statsList = React.useMemo(() => {
    return Object.values(statistics) || [];
  }, [statistics]);

  return (
    <Grid size={12} container spacing={3}>
      <Grid size={12}>
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: "600",
            display: "inline-block",
            color: "primary.main",
            borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`,
            pb: 0.5,
            mb: 1,
          }}
        >
          Panelists Statistics
        </Typography>
      </Grid>

      {statsList.map((stat, index) => {
        const { icon, lightColor, iconColor, shadow } = getCategoryDetails(
          stat?.label,
        );
        return (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
            <motion.div
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              style={{ height: "100%" }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: "100%",
                  minHeight: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: "18px",
                  bgcolor: "background.paper",
                  boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.02)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    boxShadow: `0 12px 24px -6px ${shadow}, 0 4px 12px 0 rgba(0, 0, 0, 0.04)`,
                    borderColor: iconColor,
                  },
                }}
              >
                {/* Glowing decorative background circle */}
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    bgcolor: lightColor,
                    position: "absolute",
                    right: -25,
                    bottom: -25,
                    filter: "blur(18px)",
                    zIndex: 0,
                  }}
                />

                <Box
                  sx={{
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    flex: 1,
                    mr: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "text.secondary",
                      textTransform: "capitalize",
                      letterSpacing: "0.1px",
                    }}
                  >
                    {stat?.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "700",
                      fontSize: { xs: "24px", xl: "32px" },
                      color: "text.primary",
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {Number(stat?.value || 0).toLocaleString("en-US")}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    zIndex: 1,
                    width: 56,
                    height: 56,
                    borderRadius: "14px",
                    bgcolor: lightColor,
                    color: iconColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.3s ease",
                  }}
                >
                  {icon}
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        );
      })}
    </Grid>
  );
}

function Surveys() {
  const [statistics, setStatistics] = React.useState({});
  React.useEffect(() => {
    api
      .get(`/api/v1/me/statistics`)
      .then((resp) => {
        if (!resp.data) return useToast(resp);
        let data = resp.data;
        setStatistics(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const stats = React.useMemo(() => {
    return [
      {
        label: "Total Surveys",
        value: statistics?.total ?? 0,
      },
      {
        label: "MHO Surveys",
        value: statistics?.complete ?? 0,
      },
      {
        label: "Sampledge Surveys",
        value: statistics?.points ?? 0,
      },
      {
        label: "External Surveys",
        value: statistics?.disqualified ?? 0,
      },
      {
        label: "Completes",
        value: statistics?.total ?? 0,
      },
      {
        label: "Terminates",
        value: statistics?.complete ?? 0,
      },
      {
        label: "Overquotas",
        value: statistics?.points ?? 0,
      },
      {
        label: "Security",
        value: statistics?.disqualified ?? 0,
      },
    ];
  }, [statistics]);

  return (
    <Grid size={12} container spacing={3} mt={2}>
      <Grid size={12}>
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: "600",
            display: "inline-block",
            color: "primary.main",
            borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`,
            pb: 0.5,
            mb: 1,
          }}
        >
          Surveys Statistics
        </Typography>
      </Grid>

      {stats.map((stat, index) => {
        const { icon, lightColor, iconColor, shadow } = getCategoryDetails(
          stat?.label,
        );
        return (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
            <motion.div
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              style={{ height: "100%" }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: "100%",
                  minHeight: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: "18px",
                  bgcolor: "background.paper",
                  boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.02)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    boxShadow: `0 12px 24px -6px ${shadow}, 0 4px 12px 0 rgba(0, 0, 0, 0.04)`,
                    borderColor: iconColor,
                  },
                }}
              >
                {/* Glowing decorative background circle */}
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    bgcolor: lightColor,
                    position: "absolute",
                    right: -25,
                    bottom: -25,
                    filter: "blur(18px)",
                    zIndex: 0,
                  }}
                />

                <Box
                  sx={{
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    flex: 1,
                    mr: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "text.secondary",
                      textTransform: "capitalize",
                      letterSpacing: "0.1px",
                    }}
                  >
                    {stat?.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "700",
                      fontSize: { xs: "24px", xl: "32px" },
                      color: "text.primary",
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {Number(stat?.value || 0).toLocaleString("en-US")}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    zIndex: 1,
                    width: 56,
                    height: 56,
                    borderRadius: "14px",
                    bgcolor: lightColor,
                    color: iconColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.3s ease",
                  }}
                >
                  {icon}
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        );
      })}
    </Grid>
  );
}
