import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Box,
  Container,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";

function WhoWeAre() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));
  const router = useRouter();

  const data = [
    {
      img: "wwr1",
      Heading: "100% FREE AND EASY TO JOIN",
      Subheading:
        "Free Joining Survey Earning Platform you can use to earn unlimited money for free online at home. ",
      Content:
        "MYFrequent Rewards is an interesting survey platform and app that gives quite a lot of survey offers to earn money where ever you are and access the surveys over mobile as well as on Laptop/Desktop & Tablets. You get paid in cash through PayPal UPI or gift cards.",
    },
    {
      img: "wwr2",
      Heading: "QUICK THRESHOLD OF $ 15 USD",
      Subheading:
        "Very less threshold to be achieve in a minimum time efforts and claim your money rewards ",
      Content:
        "Our free platform offers you a great way of earning by participating in daily volume of survey offers to reach your threshold goals of USD 15 and you can claim anytime with your achieved threshold rewards points .We ensure our members maximum opportunities of high earnings. After registering and completing the profile, you will soon start receiving surveys via email & registered Mobile number. Once you complete them ,you will be credited your first dollars points. When you reach the threshold you can receive the money via your PayPal / UPI account or convert them into amazing gift vouchers",
    },
    {
      img: "wwr3",
      Heading: "QUICK ACCESS OF SURVEYS WITH ONE ACCOUNT",
      Subheading:
        "Being as our community members you would be able to access multiple surveys in a single account.",
      Content:
        "Our Platform offers you a single window accounts with a multiple high money value survey access daily to earn more and more money. The more and more surveys you complete, the more your rewards balance will grow. With a single account window you can grab multiple surveys at once.",
    },
    {
      img: "wwr4",
      Heading: "WELCOME GLOBAL USERS",
      Subheading:
        "Our platform give access to the 95+ Countries users to get registered free !",
      Content:
        "We allow global users to be a member of our online research community across the globe among 95+ countries to share their loyal opinion and earn more and more money at a one stop earning solution with Myfrequentrewards. Also , Our survey offers in native language that avoid the issues of Language complexity for users and give them opportunity to share their opinions in their comfortable native language. ",
    },
    {
      img: "wwr5",
      Heading: "ALL DEVICE SUPPORT SURVEYS",
      Subheading:
        "We supports all major devices to do surveys quite efficiently",
      Content:
        "Our survey users have has no device limitations .Our survey offers are compatible with all device format whether its Mobile,Tabs, Desktops or Laptops. You can access the survey on any device anywhere at any point of time. Also, you can install the Myfrequentrewards mobile application which is compatible and available with your android as well IOS support to have quick real time access of available surveys.",
    },
    {
      img: "wwr6",
      Heading: "EASY REWARDS THORUGH PAYPAL AND GIFT VOUCHERS",
      Subheading:
        "We List 4 trusted Ways to Claim your rewards- Paypal, UPI ,Direct Bank transfer & Gift Vouchers",
      Content:
        'Our "Rewards Claim" is simple, easy, and fun. All within the palm of your hands to claim quickly. Once you claim your achieved threshold and more achieved points ,its offer you multiple choice to claim your rewards where you can claim your cash via Paypal,UPI,Direct bank Transfer or in any gift Voucher conversion and we make it process as per your choice of claim preference.',
    },
    {
      img: "wwr7",
      Heading: "HUGE RANGE OF SURVEY OFFERS",
      Subheading: " You get wide range of Surveys in a week with high pay-outs",
      Content:
        "Myfrequentrewards Platform keeps you engage with wide range of surveys daily to have your insightful feedback and to give you maximum high earning opportunities. Your successful survey participation history and activity records allow you to have access on more and more survey on your survey account window.",
    },
    {
      img: "wwr8",
      Heading:
        "DIVERSE COMMUNITY WITH 1.85+ MILLION BUSINESS AND 2.20M+ CONSUMER AUDIENCES",
      Subheading:
        "We allow diverse community of audiences on our platform for Consumers & Business profiles",
      Content:
        "Our Current community consist of 1.85M= Consumers and 2.20M+ of Business audiences that offers you a multicultural platform to helps you to connect or access the diverse surveys of various brands and these brands can undeniably benefit from reaching diverse audiences like you and more new other multicultural consumers in different racial, ethnic, culture to have right opinion for their business growth",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isSmallScreen) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % data.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isSmallScreen, data.length]);

  return (
    <Grid container sx={{ pt: "80px", px: 0 }}>
      <Box sx={{ position: "relative", width: "100%", overflow: "hidden" }}>
        <Box
          component="video"
          poster="/imagesmfr/videos/deskwork.jpg"
          preload="auto"
          loop
          autoPlay
          muted
          playsInline
          sx={{
            scale: 1.1,
            width: {
              xs: "600px",
              sm: "100%",
            },
            height: {
              xs: "calc(100vh - 70px)",
              lg: "1024px",
            },
            objectFit: "fill",
          }}
        >
          <source src="imagesmfr/videos/deskwork.mp4" type="video/mp4" />
          <source src="imagesmfr/videos/deskwork.webm" type="video/webm" />
        </Box>

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            color: "#fff",
            pt: { xs: 6, md: 10 },
            pb: { xs: 0, md: 10 },
          }}
        >
          <Container maxWidth="lg" sx={{ textAlign: "center" }}>
            <Box
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "16px", md: "28px" },
                display: "inline-block",
              }}
            >
              WHO WE ARE
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
                      from: { left: 0 },
                      to: { left: "calc(100% - 10px)" },
                    },
                  }}
                />
              </Box>
            </Box>

            <Container maxWidth="sm" sx={{ textAlign: "center", mt: 2 }}>
              <Typography fontSize={16} mt={4} mb={2}>
                We are online global research community of Frequent Research.
                MyFrequentRewards is a platform that provides a volume of survey
                offers to earn wherever you are.
              </Typography>
              <Typography fontSize={16} my={2}>
                This is a very unique and fast earning site with a fairly low
                pay-out threshold of $15. Some of other reward has higher
                pay-out threshhold.
              </Typography>
            </Container>

            <Grid container spacing={4} mt={isSmallScreen ? 0 : 2} py={6}>
              {isSmallScreen ? (
                <Grid size={12}>
                  <Box
                    sx={{
                      width: "100%",
                      border: "1px solid",
                      borderColor: "primary.main",
                      borderRadius: 2,
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      transition: "all 0.5s ease",
                      minHeight: 240,
                    }}
                  >
                    <Typography
                      fontSize={20}
                      fontWeight="500"
                      mb={2}
                      textAlign="center"
                    >
                      {data[currentIndex].Heading}
                    </Typography>
                    <Typography mt={1} fontStyle="italic" textAlign="center">
                      {data[currentIndex].Subheading}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => router.push("/who-we-are")}
                      sx={{
                        borderRadius: 20,
                        bgcolor: "white",
                        color: "primary.main",
                        mt: 2,
                      }}
                    >
                      Read More
                    </Button>
                  </Box>
                  <Grid
                    size={12}
                    container
                    justifyContent="center"
                    spacing={1}
                    sx={{
                      position: "absolute",
                      bottom: 20,
                      justifySelf: "center",
                    }}
                  >
                    {data.map((_, index) => (
                      <Box
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        sx={{
                          width: currentIndex === index ? 14 : 8,
                          height: 8,
                          borderRadius: 10,
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          bgcolor:
                            currentIndex === index
                              ? "primary.main"
                              : "rgba(255,255,255,0.4)",
                        }}
                      />
                    ))}
                  </Grid>
                </Grid>
              ) : (
                data.map((item, index) => (
                  <Grid
                    key={index}
                    size={{ xs: 12, md: 6, lg: 3 }}
                    sx={{ perspective: "1200px" }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        height: 240,
                        "&:hover .flip-inner, &:focus-within .flip-inner": {
                          transform:
                            index < 4 ? "rotateY(180deg)" : "rotateX(180deg)",
                        },
                      }}
                    >
                      <Box
                        className="flip-inner"
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          transformStyle: "preserve-3d",
                          transition: "transform 0.7s ease",
                          pointerEvents: "none",
                        }}
                      >
                        {/* Front */}
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            backfaceVisibility: "hidden",
                            border: "1px solid",
                            borderColor: "primary.main",
                            borderRadius: 2,
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <Typography fontSize={20} fontWeight="500" mb={2}>
                            {item.Heading}
                          </Typography>
                          <Typography mt={1} fontStyle="italic">
                            {item.Subheading}
                          </Typography>
                        </Box>

                        {/* Back */}
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            backfaceVisibility: "hidden",
                            transform:
                              index < 4 ? "rotateY(180deg)" : "rotateX(180deg)",
                            border: "1px solid",
                            borderColor: "primary.main",
                            borderRadius: 2,
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              "linear-gradient(180deg, #4d84de,  #063686)",
                            pointerEvents: "auto",
                          }}
                        >
                          <Typography
                            fontSize={16}
                            lineHeight={1.6}
                            sx={{ fontStyle: "italic" }}
                          >
                            {item.Subheading}
                          </Typography>

                          <Button
                            variant="contained"
                            onClick={() => router.push("/who-we-are")}
                            sx={{
                              borderRadius: 20,
                              bgcolor: "white",
                              color: "primary.main",
                              mt: 2,
                            }}
                          >
                            Read More
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                ))
              )}
            </Grid>
          </Container>
        </Box>
      </Box>
    </Grid>
  );
}

export default WhoWeAre;
