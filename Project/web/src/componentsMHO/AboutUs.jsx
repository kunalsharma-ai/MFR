import React from "react";
import { Grid, Typography, Button, Box, Container } from "@mui/material";

function AboutUs() {
  return (
    <Container maxWidth="lg">
      <Grid
        size={12}
        container
        spacing={6}
        justifyContent="center"
        alignItems="center"
        sx={{
          height: { xs: "auto", lg: "456px" },
          pt: { xs: "50px", lg: "80px" },
          pb: { xs: 0, lg: "80px" },
        }}
      >
        <Grid
          container
          size={{ xs: 12, lg: 6 }}
          sx={{ alignItems: "center", justifyContent: "center" }}
        >
          <Box
            sx={{
              position: { xs: "static", lg: "relative" },
              height: "auto",
              width: { xs: "100vw", lg: "440px" },
              overflow: "visible",
            }}
          >
            <img
              src="/imagesmfr/slider/02.jpg"
              alt="image"
              height="100%"
              width="100%"
              style={{ borderRadius: 0, boxShadow: 4 }}
            />
          </Box>
        </Grid>
        <Grid
          size={{ xs: 10, lg: 6 }}
          container
          justifyContent="center"
          direction="column"
        >
          <Grid container direction="column" spacing={4}>
            <Box>
              <Box
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "16px", md: "28px" },
                  display: "inline-block",
                  fontWeight: "bold",
                }}
              >
                ABOUT US
                <Box
                  sx={{
                    width: "100%",
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
                      animation: "moveBall 2s ease-in-out infinite alternate",
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
            </Box>
            <Box>
              <Typography
                sx={{ fontSize: "17px", mb: 1, textAlign: "justify" }}
              >
                MyFrequentRewards is a world wide Consumer and Business
                Community of Frequent Research.
              </Typography>
              <Typography sx={{ fontSize: "16px", textAlign: "justify", color: "text.secondary" }}>
                MyFrequentRewards welcomes you as our new panel members to take
                participate and share your opinion and perspective to
                wide-ranging market research survey campaigns. It is a platform
                which helps you to generate more and more revenues in high
                incentive rewards. You get the studies that are best fit for
                you. The more participation you do in the surveys, You will be
                able to earn more and more money.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Grid>{" "}
    </Container>
  );
}

export default AboutUs;
