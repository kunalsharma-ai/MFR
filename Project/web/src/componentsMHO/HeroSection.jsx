"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Typography,
  Button,
  Container,
  useTheme,
  useMediaQuery,
  Grid,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RequestQuote from "./RequestQuote";

const BannerData = [
  {
    title: "Get unlimited earning opportunities with us",
    caption: "100% free membership, Join quickly",
    backgroundImg: "/imagesmfr/slider/01.jpg",
  },
  {
    title: "Earn upto $ 10 for your every quality and right opinion.",
    caption:
      "Your honest opinion will help to choose the world's industries to take right decisions for their businesses",
    backgroundImg: "/imagesmfr/slider/02.jpg",
  },
  {
    title: "Start fast and easy earning now",
    caption: "Make a quick registration and earn daily bumper rewards.",
    backgroundImg: "/imagesmfr/slider/03.jpg",
  },
];

const HeroSection = ({
  openSignUp,
  setOpenSignUp,
  openLogin,
  setOpenLogin,
}) => {
  const [openQuote, setOpenQuote] = React.useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Preload images
  useEffect(() => {
    BannerData.forEach((banner) => {
      const img = new Image();
      img.src = banner.backgroundImg;
    });
  }, []);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BannerData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle manual dot click
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <Box
      sx={{
        bgcolor: "white",
        // height: { xs: "calc(100vh - 70px)", lg: "calc(100vh - 78px)" },
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: { xs: "100vh", lg: "620px" },
          // height: { xs: "calc(75vh - 70px)", lg: "calc(75vh - 78px)" },
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Slides */}
        <AnimatePresence initial={false}>
          <motion.div
            key={currentSlide}
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "-100%" }}
            transition={{
              duration: 1.2,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Background Image */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundImage: `url(${BannerData[currentSlide].backgroundImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />

            {/* Dark Overlay */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)",
              }}
            />

            {/* Text Content */}
            <Container maxWidth="lg">
              <Box
                sx={{
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: isMobile ? "center" : "flex-start",
                  textAlign: isMobile ? "center" : "left",
                  px: { xs: 2, sm: 4 },
                  py: { xs: 4, md: 0 },
                }}
              >
                <Typography
                  variant="h4"
                  component={motion.h4}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  sx={{
                    fontSize: {
                      xs: "1.75rem",
                      sm: "2rem",
                      md: "2.5rem",
                      lg: "3rem",
                    },
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: 2,
                    color: "white",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                    maxWidth: isMobile ? "100%" : "800px",
                  }}
                >
                  {BannerData[currentSlide].title}
                </Typography>

                <Typography
                  variant="h5"
                  component={motion.h5}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
                    fontWeight: 400,
                    lineHeight: 1.5,
                    mb: { xs: 3, md: 4 },
                    color: "rgba(255,255,255,0.9)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                    maxWidth: { xs: "100%", md: "600px" },
                  }}
                >
                  {BannerData[currentSlide].caption}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: isMobile ? "center" : "flex-start",
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenSignUp(!openSignUp)}
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
                      px: { xs: 3, md: 5 },
                      py: { xs: 1, md: 1.5 },
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
                    Join Us Today <ArrowForwardIcon sx={{ ml: 1 }} />
                  </Button>
                </Box>
              </Box>
            </Container>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators (Dots) */}
        <Box
          sx={{
            position: "absolute",
            bottom: { xs: 130, md: 140 },
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 1.5,
            zIndex: 10,
          }}
        >
          {BannerData.map((_, index) => (
            <Box
              key={index}
              onClick={() => goToSlide(index)}
              sx={{
                width: currentSlide === index ? 56 : 20,
                height: 10,
                borderRadius: "999px",
                backgroundColor:
                  currentSlide === index ? "secondary.main" : "primary.main",
                cursor: "pointer",
                transition: "all 0.4s ease",
                "&:hover": {
                  backgroundColor:
                    currentSlide === index
                      ? "secondary.main"
                      : "rgba(255,255,255,0.8)",
                },
              }}
            />
          ))}
        </Box>
      </Box>
      <HeroCards
        setOpenQuote={setOpenQuote}
        setOpenLogin={setOpenLogin}
        setOpenSignUp={setOpenSignUp}
      />
      <RequestQuote
        open={openQuote}
        onClose={() => {
          setOpenQuote(false);
        }}
      />
    </Box>
  );
};

export default HeroSection;

function HeroCards({ setOpenQuote, setOpenLogin, setOpenSignUp }) {
  const cardData = [
    {
      icon: "fa-solid fa-user-plus",
      title: "Ready to Participate",
      buttonText: "Join Our Panel",
      onClick: () => {
        setOpenSignUp(true);
      },
    },
    {
      icon: "fa-solid fa-users",
      title: "Already Registered",
      buttonText: "Login",
      onClick: () => {
        setOpenLogin(true);
      },
    },
    {
      icon: "fa-solid fa-handshake",
      title: "Get a Quote",
      buttonText: "Request Quote",
      onClick: () => {
        setOpenQuote(true);
      },
    },
  ];
  return (
    <Container
      maxWidth="lg"
      sx={{
        position: { xs: undefined, lg: "relative" },
        bottom: { lg: 90 },
        left: 0,
        right: 0,
        pt: { xs: 4, lg: 0 },
        px: { xs: 2, md: 4 },
        zIndex: 10,
      }}
    >
      <Grid size={12} container spacing={4} sx={{ minHeight: 200 }}>
        {cardData.map((card, index) => (
          <Grid
            key={index}
            size={{ xs: 12, lg: 4 }}
            container
            spacing={0}
            sx={{
              alignItems: "center",
              bgcolor: "white",
              py: 5,
              boxShadow: 2,
              borderRadius: 2,
              color: "black",
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: "primary.main",
                transform: "translateX(8px)",

                "& .card-title": {
                  color: "white",
                },

                "& .icon-box": {
                  bgcolor: "white",
                  color: "primary.main",
                },

                "& .card-btn": {
                  backgroundColor: "white",
                  color: "primary.main",

                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.15)",

                    color: "white",
                  },
                },
              },
            }}
          >
            <Grid
              size={12}
              alignItems="center"
              justifyContent="center"
              container
            >
              <Box
                className="icon-box"
                sx={{
                  display: "inline-block",
                  padding: "20px",
                  borderRadius: "30% 70% 60% 40% / 34% 30% 70% 66%",
                  marginBottom: "25px",
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": { bgcolor: "white", color: "#0c5adb" },
                }}
              >
                <i
                  className={card.icon}
                  style={{
                    fontSize: 40,
                  }}
                ></i>
              </Box>
            </Grid>
            <Typography
              className="card-title"
              sx={{
                fontWeight: 500,
                fontSize: 24,
                mb: 2,
                textAlign: "center",
                width: "100%",
                color: "black",
                transition: "all 0.3s ease",
              }}
            >
              {card.title}
            </Typography>
            <Button
              onClick={card?.onClick}
              className="card-btn"
              variant="contained"
              sx={{
                position: "relative",
                overflow: "hidden",
                fontSize: 16,
                textTransform: "none",
                mx: "auto",
                borderRadius: 20,
                px: 4,
                transition: "all 0.3s ease",

                zIndex: 1,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  width: "0%",
                  height: "100%",
                  bgcolor: "secondary.main",
                  transition: "width 0.35s ease",
                  zIndex: -1,
                  borderRadius: "inherit",
                },
                "&:hover": {
                  bgcolor: "transparent",
                },
                "&:hover::before": {
                  width: "100%",
                },
              }}
            >
              {card.buttonText}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
