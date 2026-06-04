import React from "react";
import { Box, Container, Typography, Grid, Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function HowItWorks() {
  return (
    <Box>
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
            fontWeight: "bold",
          }}
        >
          HOW IT WORKS
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

        <Typography fontSize={16} mb={2}>
          Register free online and activate your account with active email in a
          few second
        </Typography>
      </Grid>

      <HowItWorksCards />
    </Box>
  );
}

function HowItWorksCards() {
  const router = useRouter();
  const cardData = [
    {
      icon: "imagesmfr/verify.png",
      title: "REGISTER ONLINE",
      description:
        "We have a lifetime free membership to join our research community , we have a very simple and quick way to join, you just need to register with your active email id and in a single click you become our community member. Once you make registration you are able to get free bonus points of 220Pts . You do not have to spend much time on being a member, as you will receive an email invitation, when there is a new survey available. So you do not have to login to the site to check yourself every time.",
    },
    {
      icon: "imagesmfr/clipboard.png",
      title: "PROFILER SURVEY",
      description:
        "Click on Profile Survey as soon as you get enter into your Dashboard to get rewarded with your first Reward and complete your profiling with few quick inputs to earn more rewards value. You will be rewarded with value points to complete each your profiling. Our profiling points system have a higher pay-out to achieve your threshold therefore as compare to other earning portals, it does not take too long to reach the threshold on MyFrequent Rewards.",
    },
    {
      icon: "imagesmfr/call-center.png",
      title: "DAILY SURVEYS",
      description:
        "Once you complete your all profiling survey you start receiving wide range of Surveys daily according to your profiling. After each survey participation and achieving your threshold or more, you will be rewarded with value points and those points will be redeemed to your PayPal account on every month billing Cycle into cash. Incase, you are unable to achieve your threshold in current month then all your existing rewards point will be forwarded to your coming month points and it will be continued till the threshold will not be achieved , you will be paid once you achieve your threshold or more.",
    },
    {
      icon: "imagesmfr/bars.png",
      title: "HOW YOU GROW",
      description:
        "The higher your survey participation , climbs you in the survey ranking, and the more attractive it becomes for potential participants - and the more people participate in it. The better your survey is ranked in the Survey Ranking, the more points others receive for their participation (You will get Incentivise Points of 1500 every month with your current points if you achieve your threshold or more continuously for 6 months in the Survey Ranking).",
    },
  ];

  return (
    <Grid
      size={12}
      container
      spacing={4}
      sx={{ minHeight: 200 }}
      mb={10}
      px={4}
    >
      {cardData.map((card, index) => (
        <Grid
          key={index}
          size={{ xs: 12, md: 6, lg: 3 }}
          container
          spacing={0}
          sx={{
            boxShadow: 3,
            position: "relative",
            overflow: "hidden",
            alignItems: "center",
            bgcolor: "white",
            py: 5,
            boxShadow: 2,
            borderRadius: 2,
            border: "1px solid #0c5adb",
            color: "black",
            transition: "all 0.3s ease",

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

            "& > *": {
              position: "relative",
              zIndex: 1,
            },

            "&:hover": {
              borderColor: "transparent",

              "& .card-title, & .card-description": {
                color: "white",
              },

              "& .card-btn": {
                backgroundColor: "white",
                color: "secondary.main",

                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "white",
                },
              },
            },
          }}
        >
          <Grid size={12} alignItems="center" justifyContent="center" container>
            <Box
              className="icon-box"
              sx={{
                display: "inline-block",
                padding: "20px",
                borderRadius: "30% 70% 60% 40% / 34% 30% 70% 66%",
                marginBottom: "25px",
                bgcolor: "white",
                color: "primary.main",
                boxShadow: 1,
              }}
            >
              <img
                src={card.icon}
                alt={card.title}
                style={{
                  width: 40,
                  height: 40,
                }}
              />
            </Box>
          </Grid>
          <Typography
            className="card-title"
            sx={{
              fontWeight: 400,
              fontSize: 20,
              mb: 2,
              textAlign: "center",
              width: "100%",

              transition: "all 0.3s ease",
            }}
          >
            {card.title}
          </Typography>
          <Typography
            className="card-description"
            sx={{
              fontSize: 16,
              mb: 3,
              px: 2,
              textAlign: "center",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              transition: "all 0.3s ease",
            }}
          >
            {card.description}
          </Typography>
          <Button
            className="card-btn"
            variant="contained"
            onClick={() => {
              router.push("/how-it-works");
            }}
            sx={{
              fontSize: 16,
              textTransform: "none",
              mx: "auto",
              borderRadius: 20,
              px: 4,
              transition: "all 0.3s ease",
            }}
          >
            Read More
          </Button>
        </Grid>
      ))}
    </Grid>
  );
}
