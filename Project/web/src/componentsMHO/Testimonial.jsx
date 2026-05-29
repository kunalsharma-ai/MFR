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
      "Frankly say this is one of the best site who offer the real money otherwise I was fade up with fake advertisements. Good work support",
  },
  {
    user: "Peter knot",
    country: "UK",
    content:
      "I have participated in an in-house survey and completed the profiling to cover the threshold part to check the payment term. But Now, I am addicted and waiting for more survey and gain more points daily. Very Easy payment procedure and good for alternative income after covid. Thanks alot myfrequentrewards team. cheers:)",
  },
  {
    user: "Maggie Bonnet",
    country: "USA",
    content:
      "I easily make over $50 per month taking online surveys about houseware products or any electric gadgets. Also, I find these surveys very interesting and easy to earn.",
  },
  {
    user: "Jasper",
    country: "UK",
    content:
      "It’s very relaxing to take online surveys on my laptop or phone via mail notification and start proceeding for the surveys. I like knowing my opinion helps shape product development. And, getting rewarded for sharing my opinion is a huge plus!",
  },
  {
    user: "Dmitri RozH",
    country: "Russia",
    content:
      "Great platform to earn more. Appreciate frequentrewards team and thanks",
  },
  {
    user: "Galina Ford",
    country: "Russia",
    content:
      "Very quick response team to support, Quick reward redemption. Cheersssss",
  },
  {
    user: "Shelly Makhija",
    country: "India",
    content:
      "Who don't like some extra cash bills so thank you team for effort to support my opinion to improve the real world.",
  },
  {
    user: "Absalom",
    country: "Germany",
    content:
      "I feel they offer great promotions and reward their users. Also have an amazing customer service with timely responses and great follow through. Thank you",
  },
  {
    user: "Chaoxiang Hugg",
    country: "China",
    content:
      "Great work team, it helped me a lot to earn some extra after covid pandamic. I really appreciate your work and offer us a survey to earn from any place.",
  },
  {
    user: "Charoen",
    country: "Thailand",
    content:
      "Frankly say this is one of the best site who offer the real money otherwise I was fade up with fake advertisements. Good work support",
  },
  {
    user: "Peter knot",
    country: "UK",
    content:
      "I have participated in an in-house survey and completed the profiling to cover the threshold part to check the payment term. But Now, I am addicted and waiting for more survey and gain more points daily. Very Easy payment procedure and good for alternative income after covid. Thanks alot myfrequentrewards team. cheers:)",
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
