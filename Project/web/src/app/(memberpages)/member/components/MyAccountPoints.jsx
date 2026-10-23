"use client";

import React from "react";
import {
  Box,
  Button,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  Collapse,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import { api, loadData } from "@/util";
import { useRewardsTick, fetchRewardBalance } from "@/hooks/useRewardsRefresh";
import { useMember } from "@/Context";
import { useRouter } from "next/navigation";

export default function MyAccountPoints() {
  const router = useRouter();

  const [points, setPoints] = React.useState(0);
  const [threshold, setThreshold] = React.useState(15000);
  const [conversionRate, setConversionRate] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const member = useMember();
  const rewardsTick = useRewardsTick(); // changes when a profile is completed -> the points are read again

  React.useEffect(() => {
    if (rewardsTick === 0) setIsLoading(true); // only the first time, so a refresh does not blank the box

    loadData(
      fetchRewardBalance(member),
      (resp) => {
        if (resp.status === "error") {
          return;
        }

        const data = resp.data;

        setPoints(data?.totalPoints ?? 0);
        setThreshold(data?.threshold ?? 15000);
        setConversionRate(data?.conversionRate ?? 0);
      },
      () => {
        setIsLoading(false);
      },
    );
  }, [rewardsTick, member?._id]);

  const percentage = Math.min((points / threshold) * 100, 100);
  const rewardAmount = Number(points) * Number(conversionRate);

  return (
    <Collapse
      in={!isLoading}
      timeout={500}
      unmountOnExit
      sx={{ width: "100%" }}
    >
      <Box
        sx={{
          width: "100%",
          borderRadius: "22px",
          overflow: "hidden",
          position: "relative",
          px: { xs: 2, md: 4 },
          py: { xs: 2.5, md: 3 },
          background:
            "linear-gradient(135deg, #001B66 0%, #0037A6 55%, #0A47C9 100%)",
          border: "1px solid rgba(245, 160, 0, 0.18)",
          boxShadow: "0 12px 40px rgba(0, 27, 102, 0.35)",
        }}
      >
        {/* Decorative Pattern */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.07,
            backgroundImage: `
            linear-gradient(120deg, transparent 0%, transparent 48%, #FFD166 49%, transparent 50%),
            linear-gradient(60deg, transparent 0%, transparent 48%, #FFD166 49%, transparent 50%)
          `,
            backgroundSize: "220px 220px",
            pointerEvents: "none",
          }}
        />

        {/* Glow Effects */}
        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(245, 160, 0, 0.15)",
            filter: "blur(80px)",
            top: -120,
            right: -80,
            pointerEvents: "none",
          }}
        />

        <Grid
          container
          spacing={3}
          alignItems="center"
          position="relative"
          zIndex={2}
        >
          {/* Left Section */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.9)",
                fontSize: { xs: "20px", md: "28px" },
                fontWeight: 500,
                lineHeight: 1.1,
              }}
            >
              Current Rewards:
            </Typography>

            <Typography
              sx={{
                mt: 1,
                fontSize: { xs: "36px", xl: "58px" },
                lineHeight: 1,
                fontWeight: 800,
                // background: "linear-gradient(180deg, #FFE29A 0%, #F5A000 100%)",
                // WebkitBackgroundClip: "text",
                // WebkitTextFillColor: "transparent",
                color: "secondary.main",
                letterSpacing: "-1px",
              }}
            >
              {points.toLocaleString()} pts
            </Typography>

            <Typography
              sx={{
                mt: 0.75,
                color: "secondary.main",
                fontSize: { xs: "15px", md: "18px" },
                fontWeight: 600,
              }}
            >
              ({rewardAmount.toMoney("USD")})
            </Typography>
          </Grid>

          {/* Center Trophy */}
          <Grid
            size={{ xs: 12, md: 2 }}
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                color: "secondary.main",
              }}
            >
              <EmojiEventsRoundedIcon
                sx={{
                  fontSize: 74,
                  filter: "drop-shadow(0 0 18px rgba(245,160,0,0.35))",
                }}
              />
            </Stack>
          </Grid>

          {/* Right Section */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography
                sx={{
                  color: "secondary.main",
                  fontWeight: 700,
                  fontSize: { xs: "14px", md: "16px" },
                  letterSpacing: 0.2,
                }}
              >
                Payout Milestone
              </Typography>

              <FlagRoundedIcon
                sx={{
                  color: "secondary.main",
                  fontSize: 28,
                }}
              />
            </Stack>

            <Box sx={{ position: "relative" }}>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 18,
                  borderRadius: "999px",
                  backgroundColor: "rgba(255,255,255,0.14)",
                  overflow: "hidden",

                  "& .MuiLinearProgress-bar": {
                    borderRadius: "999px",
                    backgroundColor: "secondary.main",
                  },
                }}
              />

              <Typography
                sx={{
                  mt: 1,
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                [{points.toLocaleString()} / {threshold.toLocaleString()} pts to
                Payout]
              </Typography>

              <Typography 
                sx={{ 
                  mt: 1, 
                  color: "secondary.main", 
                  fontSize: "12px", 
                  fontWeight: 700, 
                  lineHeight: 1.4,
                }} 
              > 
                Users can claim their rewards once they reach the{" "}
                {threshold.toLocaleString()} pts.
              </Typography>
            </Box>

            {points >= threshold && (
              <Button
                variant="contained"
                sx={{
                  mt: 2.5,
                  borderRadius: 999,
                  px: 3,
                  py: 1,
                  fontWeight: 800,
                  textTransform: "none",
                  background:
                    "linear-gradient(90deg, #F5A000 0%, #FFB938 100%)",
                  color: "#001B66",
                  boxShadow: "0 8px 24px rgba(245,160,0,0.35)",

                  "&:hover": {
                    background:
                      "linear-gradient(90deg, #E59400 0%, #F5A000 100%)",
                  },
                }}
              >
                Redeem Now
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>
    </Collapse>
  );
}
