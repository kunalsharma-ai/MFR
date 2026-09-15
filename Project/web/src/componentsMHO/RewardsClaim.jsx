"use client";

import React from "react";
import { Box, Typography, Grid } from "@mui/material";

import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function RewardClaims() {
  const rewardData = [
    {
      icon: <CardGiftcardIcon />,
      title: "EARN REWARDS",
      description:
        "Participate in eligible surveys and research studies to earn valuable rewards.",
    },
    {
      icon: <AccountBalanceWalletIcon />,
      title: "CHECK YOUR BALANCE",
      description:
        "Keep track of your available rewards and monitor your earned points.",
    },
    {
      icon: <AssignmentTurnedInIcon />,
      title: "SUBMIT A CLAIM",
      description:
        "Request your reward when you meet the eligibility and claim requirements.",
    },
    {
      icon: <CheckCircleIcon />,
      title: "RECEIVE YOUR REWARD",
      description:
        "Get your reward after your claim has been successfully processed.",
    },
  ];

  return (
    <Box>
      {/* ========================= REWARDS CLAIMS HEADING ========================= */}
      <Grid
        size={12}
        container
        alignItems="center"
        direction="column"
        sx={{ py: 6, px: 2 }}
        spacing={4}
      >
        <Box
          sx={{
            fontWeight: "bold",
            fontSize: { xs: "16px", md: "28px" },
            display: "inline-block",
          }}
        >
          REWARDS CLAIM
          {/* Animated Heading Underline */}
          <Box
            sx={{
              width: "80%",
              mx: "auto",
              mt: 1,
              height: 5,
              bgcolor: "#cfd8ff",
              borderRadius: 5,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                bgcolor: "primary.main",
                borderRadius: "50%",
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                animation: "moveBall 3s ease-in-out infinite alternate",

                "@keyframes moveBall": {
                  from: {
                    left: 0,
                  },
                  to: {
                    left: "calc(100% - 10px)",
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Section Description */}
        <Typography
          fontSize={16}
          mb={2}
          textAlign="center"
        >
          Complete surveys, earn rewards, and easily claim your eligible
          rewards.
        </Typography>
      </Grid>

      {/* ========================= REWARDS CLAIMS CARDS ========================= */}
      <Grid
        size={12}
        container
        spacing={4}
        sx={{
          minHeight: 200,
        }}
        mb={10}
        px={4}
      >
        {rewardData.map((reward, index) => (
          <Grid
            key={index}
            size={{ xs: 12, md: 6, lg: 3 }}
            container
            spacing={0}
            sx={{
              boxShadow: 2,
              position: "relative",
              overflow: "hidden",
              alignItems: "center",
              bgcolor: "white",
              py: 5,
              borderRadius: 2,
              border: "1px solid #0c5adb",
              color: "black",
              transition: "all 0.3s ease",

              /* Hover background animation */
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                bgcolor: "secondary.main",
                transform: "scaleY(0)",
                transformOrigin: "bottom",
                transition: "transform 0.45s ease",
                zIndex: 0,
              },

              "&:hover::before": {
                transform: "scaleY(1)",
              },

              /* Keep card content above hover background */
              "& > *": {
                position: "relative",
                zIndex: 1,
              },

              /* Hover text */
              "&:hover": {
                borderColor: "transparent",

                "& .reward-title, & .reward-description": {
                  color: "white",
                },
              },
            }}
          >
            {/* ========================= ICON ========================= */}
            <Grid
              size={12}
              alignItems="center"
              justifyContent="center"
              container
            >
              <Box
                className="reward-icon"
                sx={{
                  display: "inline-flex",
                  padding: "20px",
                  borderRadius:
                    "30% 70% 60% 40% / 34% 30% 70% 66%",
                  marginBottom: "25px",
                  bgcolor: "white",
                  color: "primary.main",
                  boxShadow: 1,
                  transition: "all 0.3s ease",
                  alignItems: "center",
                  justifyContent: "center",

                  "& svg": {
                    fontSize: 40,
                  },
                }}
              >
                {/* 
                  TODO:
                  Replace this temporary MUI icon with the
                  approved MFR image icon once finalized.
                */}
                {reward.icon}
              </Box>
            </Grid>

            {/* =========================
                TITLE
            ========================= */}
            <Typography
              className="reward-title"
              sx={{
                fontWeight: 400,
                fontSize: 20,
                mb: 2,
                textAlign: "center",
                width: "100%",
                transition: "all 0.3s ease",
              }}
            >
              {reward.title}
            </Typography>

            {/* =========================
                DESCRIPTION
            ========================= */}
            <Typography
              className="reward-description"
              sx={{
                fontSize: 16,
                mb: 1,
                px: 2,
                textAlign: "center",
                lineHeight: 1.5,
                transition: "all 0.3s ease",
              }}
            >
              {reward.description}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}