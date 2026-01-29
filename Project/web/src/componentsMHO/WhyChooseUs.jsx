import React from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Typography, Grid, Button } from "@mui/material";

import { motion } from "framer-motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function WhyChooseUs() {
  const router = useRouter();
  const data = [
    {
      img: "/imagesmfr/1.png",
      title: "100% Free Membership",
    },
    {
      img: "/imagesmfr/2.png",
      title: "High earning per survey",
    },
    {
      img: "/imagesmfr/3.png",
      title: "Information are secured and confidential",
    },
    {
      img: "/imagesmfr/4.png",
      title: "Quick modes of money transfer",
    },
    {
      img: "/imagesmfr/5.png",
      title: "Share Your Opinion Anytime, Anywhere, Anyplace.",
    },
    {
      img: "/imagesmfr/6.png",
      title: "Profile Updation",
    },
  ];

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
          WHY CHOOSE US
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
          My Frequent Reward is a World Wide Survey Panel. You will get the high
          pay-out regular survey.
        </Typography>

        <Container maxWidth="lg">
          <Grid container size={12} spacing={4}>
            <Grid size={{ xs: 12, md: 6 }} container alignItems="center" mb={{ xs: 0, md: 8 }}>
              <Box
                sx={{
                  width:{xs:310,sm: "100%"},
                  height: { xs: "144px",sm:386, md: 300, lg: 380 },
                  overflow: "hidden",
                }}
              >
                <video
                  poster="/imagesmfr/videos/deskwork.jpg"
                  preload="auto"
                  loop
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "cover",
                    display: "block",
                  }}
                >
                  <source
                    src="imagesmfr/videos/youtube-video.mp4"
                    type="video/mp4"
                  />
                  <source
                    src="imagesmfr/videos/youtube-video.webm"
                    type="video/webm"
                  />
                </video>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {data.map((d, i) => (
                <Grid
                  size={12}
                  key={i}
                  container
                  alignItems="center"
                  sx={{ borderBottom: "1px solid #f4f4f4", py: 1.5, pl: 1 }}
                >
                  <img
                    src={d?.img}
                    alt="icon"
                    style={{ width: "40px", height: "40px", marginRight: 30 }}
                  />
                  <Typography fontSize={16} sx={{ flex: 1 }}>
                    {d?.title}
                  </Typography>
                </Grid>
              ))}

              <Grid
                size={12}
                container
                justifyContent={{ xs: "center", lg: "flex-start" }}
              >
                {" "}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    router.push("/why-choose-us");
                  }}
                  component={motion.button}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    color: "white",
                    fontSize: { xs: "1rem", md: "1.1rem" },
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    ml: 2,
                    mt: 4,
                    borderRadius: 0,
                    boxShadow: 2,
                    textTransform: "none",
                    zIndex: 1,

                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "0%",
                      height: "100%",
                      bgcolor: "secondary.main",
                      transition: "width 0.35s ease",
                      zIndex: -1,
                    },

                    "&:hover::before": {
                      width: "100%",
                    },
                  }}
                >
                  Read More <ArrowForwardIcon sx={{ ml: 1, mb: 0.5 }} />
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Grid>
    </Box>
  );
}
