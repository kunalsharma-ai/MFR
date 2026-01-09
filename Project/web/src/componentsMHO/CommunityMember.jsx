import React from "react";
import { Box, Container, Typography, Grid } from "@mui/material";

export default function CommunityMember() {
  const data = [
    {
      img: "/imagesmfr/edit.png",
      title: "REGISTER",
      description: "Register with your active email id and contact number",
    },
    {
      img: "/imagesmfr/certified.png",
      title: "VERIFY",
      description:
        "Check your mail and Phone and click on verification links to complete your registration",
    },
    {
      img: "/imagesmfr/surveyor.png",
      title: "ACCESS SURVEYS",
      description:
        "After Activating your account participate in available surveys and start sharing your ideas",
    },
    {
      img: "/imagesmfr/medal.png",
      title: "GET REWARDED",
      description: "Acheive your threshold to claim the rewards via paypal",
    },
  ];

  return (
    <Box>
      <Grid
        container
        direction="column"
        alignItems="center"
        sx={{ py: 6, px: 2, bgcolor: "#eee" }}
        spacing={4}
      >
        <Box sx={{ fontSize: { xs: 16, md: 28 }, fontWeight: "bold" }}>
          STEPS TO BE A COMMUNITY MEMBER
          <Box
            sx={{
              width: "40%",
              mx: "auto",
              mt: 1,
              height: 5,
              bgcolor: "#cfd8ff",
              borderRadius: 5,
              position: "relative",
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
                  from: { left: 0 },
                  to: { left: "calc(100% - 10px)" },
                },
              }}
            />
          </Box>
        </Box>

        <Typography fontSize={16} sx={{ width: "75%", textAlign: "center" }}>
          MyFrequentRewards research panel community provides a very simple and
          easy way to engage you as our new community member. You just need to
          follow a few small steps to be a part of our global community to earn
          rewards with free registration.
        </Typography>

        <Container maxWidth="md">
          {data.map((item, index) => {
            const isEven = index % 2 === 0;
            const isLast = index === data.length - 1;

            return (
              <Grid
                container
                key={index}
                py={4}
                sx={{
                  "&:hover .dotted-line": {
                    borderColor: "primary.main",
                  },
                  "&:hover .icon-container": {
                    borderColor: "primary.main",
                  },
                  "&:hover .rotate-icon": {
                    animation: "spin 1.8s linear infinite",
                  },
                  "@keyframes spin": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(-360deg)" },
                  },
                }}
              >
                {isEven ? (
                  <>
                    <Grid
                      container
                      size={{ xs: 12, md: 6 }}
                      alignItems="center"
                    >
                      <Grid size={7}>
                        <Typography fontSize={20} fontWeight={500}>
                          {item.title}
                        </Typography>
                        <Typography fontSize={16}>
                          {item.description}
                        </Typography>
                      </Grid>

                      <Grid
                        size={5}
                        container
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Box sx={{ position: "relative" }}>
                          <Box
                            className="icon-container"
                            sx={{
                              bgcolor: "white",
                              border: "1.5px dashed lightgrey",
                              borderRadius: "50%",
                              p: { xs: 3, lg: 4 },
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              zIndex: 2,
                              transition: "border-color 1s ease",
                            }}
                          >
                            <Box
                              component="img"
                              className="rotate-icon"
                              src={item.img}
                              alt="icon"
                              width={{ xs: 35, lg: 45 }}
                              height={{ xs: 35, lg: 45 }}
                            />
                          </Box>

                          {!isLast && (
                            <Box
                              className="dotted-line"
                              sx={{
                                position: "absolute",
                                width: 160,
                                borderTop: "1px dashed lightgrey",
                                top: "90%",
                                left: "100%",
                                transform:
                                  "translateY(-10px) translateX(-10px) rotate(45deg)",
                                transformOrigin: "left center",
                                display: { xs: "none", md: "block" },
                                transition: "border-color 1s ease",
                              }}
                            />
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }} />
                  </>
                ) : (
                  <>
                    <Grid size={{ xs: 12, md: 6 }} />

                    <Grid
                      container
                      size={{ xs: 12, md: 6 }}
                      alignItems="center"
                    >
                      <Grid
                        size={5}
                        container
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Box sx={{ position: "relative" }}>
                          <Box
                            className="icon-container"
                            sx={{
                              bgcolor: "white",
                              border: "1.5px dashed lightgrey",
                              borderRadius: "50%",
                              p: { xs: 3, lg: 4 },
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              zIndex: 2,
                              transition: "border-color 1s ease",
                            }}
                          >
                            <Box
                              component="img"
                              className="rotate-icon"
                              src={item.img}
                              alt="icon"
                              width={{ xs: 35, lg: 45 }}
                              height={{ xs: 35, lg: 45 }}
                            />
                          </Box>

                          {!isLast && (
                            <Box
                              className="dotted-line"
                              sx={{
                                position: "absolute",
                                width: 150,
                                borderTop: "1px dashed lightgrey",
                                top: "80%",
                                right: "100%",
                                transform:
                                  "translateY(-2px) translateX(10px) rotate(-45deg)",
                                transformOrigin: "right center",
                                display: { xs: "none", md: "block" },
                                transition: "border-color 1s ease",
                              }}
                            />
                          )}
                        </Box>
                      </Grid>

                      <Grid size={7}>
                        <Typography fontSize={20} fontWeight={500}>
                          {item.title}
                        </Typography>
                        <Typography fontSize={16}>
                          {item.description}
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Grid>
            );
          })}
        </Container>
      </Grid>
    </Box>
  );
}
