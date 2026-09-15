"use client";
import React, { useState, useEffect } from "react";
import { Grid, Typography, Box, Container, IconButton } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const Testimonialsdata = [
  {
    user: "Charoen",
    country: "Thailand",
    content:
      "Frankly say this is one of the best sites that offers real money. I was fed up with fake advertisements. Good work and support.",
  },
  {
    user: "Emily",
    country: "United States",
    content:
      "I have tried several survey websites, but this one feels much more genuine. The surveys are easy to understand and payments are reliable.",
  },
  {
    user: "Daniel",
    country: "United Kingdom",
    content:
      "Really good experience so far. I like that the surveys are relevant and I can earn something in my spare time. Payment process is simple.",
  },
  {
    user: "Sophie",
    country: "France",
    content:
      "I was looking for a trustworthy paid survey platform and finally found one that actually works. The support team is also very helpful.",
  },
  {
    user: "Liam",
    country: "Australia",
    content:
      "The surveys don't take too much time and the rewards are worth it. Everything has been straightforward from registration to payment.",
  },
  {
    user: "Maria",
    country: "Spain",
    content:
      "I joined just to try it and was pleasantly surprised. The survey invitations are regular and the overall website is easy to use.",
  },
  {
    user: "Oliver",
    country: "Germany",
    content:
      "Good platform for earning a little extra through market research surveys. I especially appreciate the clear information about each survey.",
  },
  {
    user: "Aisha",
    country: "United Arab Emirates",
    content:
      "The registration was quick and I started receiving survey opportunities without any difficulty. A useful way to earn during free time.",
  },
  {
    user: "Ethan",
    country: "Canada",
    content:
      "I have had a positive experience with the platform. The surveys are simple, the website works smoothly, and rewards are clearly explained.",
  },
  {
    user: "Giulia",
    country: "Italy",
    content:
      "Much better than many survey sites I have previously tried. I like the simple interface and the fact that the surveys are relevant to my profile.",
  },
  {
    user: "Michael",
    country: "South Africa",
    content:
      "A decent and reliable survey platform. I have completed several surveys and the experience has been quite smooth. Customer support is responsive too.",
  },
  {
    user: "Priya",
    country: "India",
    content:
      "I joined mainly to earn in my spare time and have been happy with the experience. The survey instructions are clear and the platform is easy to navigate.",
  },
  {
    user: "Lucas",
    country: "Brazil",
    content:
      "I have tested a few paid survey websites and this is one of the better ones. The process is simple and I like getting surveys related to my interests.",
  },
  {
    user: "Nora",
    country: "Netherlands",
    content:
      "The website is simple, professional and easy to understand. I enjoy sharing my opinions through the surveys and earning rewards at the same time.",
  },
  {
    user: "Kenji",
    country: "Japan",
    content:
      "A convenient platform for completing surveys in free time. The registration process was easy and I have had a good overall experience with the service.",
  },
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

function Testimonial() {
  const [[index, direction], setIndex] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);

  const paginate = (newDirection) => {
    setIndex([
      (index + newDirection + Testimonialsdata.length) %
        Testimonialsdata.length,
      newDirection,
    ]);
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      paginate(1);
    }, 4000);

    return () => clearInterval(interval);
  }, [index, isPaused]);

  return (
    <Grid
      size={12}
      sx={{
        height: { xs: "100vh", lg: 680 },
        py: 12,
        position: "relative",
        bgcolor: "primary.main",
        color: "white",
        backgroundImage: "url(/imagesmfr/testi-bg.webp)",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(12, 91, 219, 0.4)",
          zIndex: 1,
        }}
      />

      <Grid
        size={12}
        container
        justifyContent="center"
        sx={{ zIndex: 2, position: "relative" }}
      >
        <Grid size={12} container justifyContent="center">
          <Box
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "16px", md: "28px" },
              display: "inline-block",
              color: "white",
            }}
          >
            TESTIMONIALS
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
        </Grid>
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            height: 500,
          }}
        >
          <IconButton
            onClick={() => paginate(-1)}
            aria-label="Back Button"
            sx={{
              position: "absolute",
              left: 5,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              color: "primary.main",
              border: "1px solid #fff",
              bgcolor: "rgba(255, 255, 255, 0.5)",
              "&:hover": { bgcolor: "primary.main", color: "#fff" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          {/* Carousel */}
          <Box
            sx={{ overflow: "hidden", flex: 1, px: 6 }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={index}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                style={{ textAlign: "center", position: "relative" }}
              >
                <Box
                  sx={{
                    fontSize: { xs: 30, md: 50 },
                    opacity: 0.5,
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <i className="fa-solid fa-quote-left" />
                </Box>

                <Typography
                  fontSize={{ xs: 16, md: 20 }}
                  pt={9}
                  pb={{ xs: 4, md: 9 }}
                >
                  {Testimonialsdata[index].content}
                </Typography>

                <Typography fontWeight="bold" fontSize={{ xs: 16, md: 18 }}>
                  - {Testimonialsdata[index].user}
                </Typography>
                <Typography fontSize={14}>
                  {Testimonialsdata[index].country}
                </Typography>
              </motion.div>
            </AnimatePresence>
          </Box>

          <IconButton
            onClick={() => paginate(1)}
            aria-label="Next button"
            sx={{
              position: "absolute",
              right: 5,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              color: "primary.main",
              border: "1px solid #fff",
              bgcolor: "rgba(255, 255, 255, 0.5)",
              "&:hover": { bgcolor: "primary.main", color: "#fff" },
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </Container>
      </Grid>
    </Grid>
  );
}

export default Testimonial;
