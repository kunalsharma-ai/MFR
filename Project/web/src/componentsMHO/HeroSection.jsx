"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";

import {
  motion,
  useMotionValue,
  useAnimationFrame,
  wrap,
  useTransform,
} from "framer-motion";

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

const surveys = [
  {
    title: "Shopping Habits",
    description:
      "Share your shopping preferences and experiences to help brands improve their products and services.",
    reward: "$4",
    duration: "10 min",
    category: "Shopping",
    color: "#1976D2",
  },
  {
    title: "Technology & Apps",
    description:
      "Tell us what you think about the latest apps, devices, and technology products.",
    reward: "$6",
    duration: "15 min",
    category: "Technology",
    color: "#8E24AA",
  },
  {
    title: "Food & Lifestyle",
    description:
      "Share your opinions about food, restaurants, brands, and everyday lifestyle choices.",
    reward: "$5",
    duration: "12 min",
    category: "Lifestyle",
    color: "#43A047",
  },
  {
    title: "Travel Experience",
    description:
      "Tell us about your travel preferences and experiences to help shape future services.",
    reward: "$7",
    duration: "18 min",
    category: "Travel",
    color: "#FB8C00",
  },
  {
    title: "Entertainment",
    description:
      "Share your views on movies, shows, games, and the entertainment you enjoy.",
    reward: "$4",
    duration: "10 min",
    category: "Entertainment",
    color: "#00ACC1",
  },
  {
    title: "Consumer Opinion",
    description:
      "Give your honest opinion about products and services and earn rewards for your participation.",
    reward: "$6",
    duration: "14 min",
    category: "Consumer",
    color: "#E53935",
  },
];

const MotionBox = motion.create(Box);

const heroContent = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const heroItem = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const heroCardsContainer = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.15,
    },
  },
};

const heroCardItem = {
  hidden: {
    opacity: 0,
    y: 45,
    scale: 0.94,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const carouselWrapper = {
  hidden: {
    opacity: 0,
    x: 60,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      delay: 0.45,
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const indicatorContainer = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.8,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const indicatorItem = {
  hidden: {
    opacity: 0,
    scaleX: 0.5,
  },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function HeroSection({
  openSignUp,
  setOpenSignUp,
  openLogin,
  setOpenLogin,
}) {
  const [openQuote, setOpenQuote] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animationSlide, setAnimationSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const slideCount = BannerData.length;

  const continuousBanners = [...BannerData, BannerData[0]];

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setHeroLoaded(true);
    });

    return () => cancelAnimationFrame(timer);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    BannerData.forEach((banner) => {
      const img = new Image();
      img.src = banner.backgroundImg;
    });
  }, []);

  useEffect(() => {
    if (!isVisible || isAutoPaused || isResetting) {
      return;
    }

    const interval = setInterval(() => {
      setAnimationSlide((prev) => prev + 1);

      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible, isAutoPaused, isResetting, slideCount]);

  const goToSlide = (index) => {
    if (isResetting) return;

    setIsAutoPaused(true);
    setCurrentSlide(index);

    setAnimationSlide(index);
  };

  const handleSlideAnimationComplete = () => {
    if (animationSlide !== slideCount) return;

    setIsResetting(true);

    setAnimationSlide(0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsResetting(false);
      });
    });
  };

  const currentBanner = BannerData[currentSlide];

  const slideWidth = 100 / continuousBanners.length;

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: {
            xs: "100vh",
            lg: "620px",
          },
          width: "100%",
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{
            x: `-${animationSlide * slideWidth}%`,
          }}
          transition={
            isResetting
              ? {
                  duration: 0,
                }
              : {
                  duration: 1.2,
                  ease: [0.4, 0, 0.2, 1],
                }
          }
          onAnimationComplete={handleSlideAnimationComplete}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            width: `${continuousBanners.length * 100}%`,
            height: "100%",
            willChange: "transform",
          }}
        >
          {continuousBanners.map((banner, index) => (
            <Box
              key={`${banner.backgroundImg}-${index}`}
              sx={{
                position: "relative",
                width: `${slideWidth}%`,
                height: "100%",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  backgroundImage: `url(${banner.backgroundImg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)",
                }}
              />
            </Box>
          ))}
        </motion.div>

        <Container
          maxWidth="xl"
          sx={{
            position: "relative",
            height: "100%",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <Grid
            container
            alignItems="center"
            sx={{
              height: "100%",
              px: {
                xs: 2,
                sm: 4,
                lg: 6,
              },
            }}
          >
            <Grid
              size={{
                xs: 12,
                lg: 6,
              }}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: isMobile ? "center" : "flex-start",
                textAlign: isMobile ? "center" : "left",
                pr: {
                  lg: 4,
                  xl: 8,
                },
                pointerEvents: "auto",
              }}
            >
              <motion.div
                key={currentSlide}
                variants={heroContent}
                initial="hidden"
                animate="visible"
                style={{
                  width: "100%",
                }}
              >
                <motion.div variants={heroItem}>
                  <Typography
                    variant="h1"
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
                      maxWidth: "700px",
                    }}
                  >
                    {currentBanner.title}
                  </Typography>
                </motion.div>

                <motion.div variants={heroItem}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontSize: {
                        xs: "1rem",
                        sm: "1.1rem",
                        md: "1.25rem",
                      },
                      fontWeight: 400,
                      lineHeight: 1.5,
                      mb: {
                        xs: 3,
                        md: 4,
                      },
                      color: "rgba(255,255,255,0.9)",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                      maxWidth: "600px",
                    }}
                  >
                    {currentBanner.caption}
                  </Typography>
                </motion.div>

                <motion.div variants={heroItem}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenSignUp(!openSignUp)}
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      color: "white",
                      fontSize: {
                        xs: "1rem",
                        md: "1.1rem",
                      },
                      fontWeight: 600,
                      px: {
                        xs: 3,
                        md: 5,
                      },
                      py: {
                        xs: 1,
                        md: 1.5,
                      },
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
                    Join Us Today
                    <ArrowForwardIcon
                      sx={{
                        ml: 1,
                      }}
                    />
                  </Button>
                </motion.div>
              </motion.div>
            </Grid>
          </Grid>
        </Container>

        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: {
              xs: "100%",
              lg: "50%",
            },
            height: "100%",
            display: {
              xs: "none",
              lg: "flex",
            },
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              width: "100%",
              pointerEvents: "auto",
            }}
          >
            <SurveyCarousel
              surveys={surveys}
              onSurveyClick={() => setOpenSignUp(true)}
              onHoverChange={setIsAutoPaused}
            />
          </Box>
        </Box>

        <MotionBox
          variants={indicatorContainer}
          initial="hidden"
          animate={heroLoaded ? "visible" : "hidden"}
          onMouseEnter={() => setIsAutoPaused(true)}
          onMouseLeave={() => setIsAutoPaused(false)}
          sx={{
            position: "absolute",
            bottom: {
              xs: 130,
              md: 140,
            },
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 1.5,
            zIndex: 10,
          }}
        >
          {BannerData.map((_, index) => (
            <MotionBox
              key={index}
              variants={indicatorItem}
              onClick={() => goToSlide(index)}
              sx={{
                width: currentSlide === index ? 56 : 20,
                height: 10,
                borderRadius: "999px",
                backgroundColor:
                  currentSlide === index ? "secondary.main" : "primary.main",
                cursor: "pointer",
                transformOrigin: "center",
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
        </MotionBox>
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
}

function SurveyCarousel({ surveys, onSurveyClick }) {
  const cards = [...surveys, ...surveys];

  const x = useMotionValue(0);
  const trackRef = useRef(null);

  const [trackWidth, setTrackWidth] = useState(0);
  const isPaused = useRef(false);

  const SPEED = 42;

  useLayoutEffect(() => {
    if (!trackRef.current) return;

    const updateWidth = () => {
      setTrackWidth(trackRef.current.scrollWidth / 2);
    };

    updateWidth();

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, [surveys]);

  useAnimationFrame((_, delta) => {
    if (!trackWidth || isPaused.current) return;

    x.set(x.get() - (SPEED * delta) / 1000);
  });

  const translateX = useTransform(x, (value) => {
    if (!trackWidth) return "0px";

    return `${wrap(-trackWidth, 0, value)}px`;
  });

  const handleMouseEnter = () => {
    isPaused.current = true;
  };

  const handleMouseLeave = () => {
    isPaused.current = false;
  };

  return (
    <Box
      component={motion.div}
      variants={carouselWrapper}
      initial="hidden"
      animate="visible"
      sx={{
        width: "100%",
        maxWidth: 680,
      }}
    >
      <Typography
        sx={{
          color: "rgba(255,255,255,.78)",
          fontSize: 12,
          mb: 1,
          ml: 2,
        }}
      >
        Browse a few of our paid surveys
      </Typography>

      <Box
        sx={{
          overflow: "hidden",
          py: 2,
          maskImage:
            "linear-gradient(to right, transparent, black 7%, black 93%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 7%, black 93%, transparent)",
        }}
      >
        <motion.div
          ref={trackRef}
          style={{
            display: "flex",
            gap: 18,
            width: "max-content",
            x: translateX,
          }}
        >
          {cards.map((survey, index) => (
            <Box
              key={`${survey.title}-${index}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              sx={{
                width: 250,
                minHeight: 180,
                flexShrink: 0,
                position: "relative",
              }}
            >
              <Box
                component={motion.div}
                whileHover={{
                  y: -6,
                  scale: 1.03,
                }}
                transition={{
                  duration: 0.2,
                }}
                sx={{
                  width: "100%",
                  minHeight: 180,
                  p: 1.75,
                  borderRadius: 3,
                  background: "rgba(255,255,255,.13)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  border: "1px solid rgba(255,255,255,.2)",
                  boxShadow: "inset 0 0 25px rgba(0,0,0,.12)",
                  transition: "box-shadow .25s, border-color .25s",

                  "&:hover": {
                    borderColor: "secondary.main",
                    boxShadow: "inset 0 0 25px rgba(0,0,0,.12)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      px: 1.1,
                      py: 0.4,
                      borderRadius: 5,
                      bgcolor: survey.color,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 10,
                    }}
                  >
                    {survey.category}
                  </Box>

                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 18,
                    }}
                  >
                    {survey.reward}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 17,
                    lineHeight: 1.3,
                    mb: 0.7,
                  }}
                >
                  {survey.title}
                </Typography>

                <Typography
                  sx={{
                    color: "rgba(255,255,255,.72)",
                    fontSize: 12,
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {survey.description}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1.5,
                    pt: 1,
                    borderTop: "1px solid rgba(255,255,255,.1)",
                  }}
                >
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,.7)",
                      fontSize: 11,
                    }}
                  >
                    {survey.duration}
                  </Typography>

                  <Button
                    onClick={onSurveyClick}
                    variant="contained"
                    color="secondary"
                    disableElevation
                    endIcon={
                      <ArrowForwardIcon
                        sx={{
                          fontSize: 16,
                        }}
                      />
                    }
                    sx={{
                      height: "30px",
                      color: "#fff",
                      minWidth: 0,
                      fontWeight: 600,
                      fontSize: 12,
                      textTransform: "none",
                      lineHeight: 1,

                      "&:hover": {
                        backgroundColor: "primary.main",
                      },

                      "& .MuiButton-endIcon": {
                        ml: 0.5,
                        mr: 0,
                      },
                    }}
                  >
                    Take Survey
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </motion.div>
      </Box>
    </Box>
  );
}

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
        position: {
          xs: undefined,
          lg: "relative",
        },
        bottom: {
          lg: 90,
        },
        left: 0,
        right: 0,
        pt: {
          xs: 4,
          lg: 0,
        },
        px: {
          xs: 2,
          md: 4,
        },
        zIndex: 10,
      }}
    >
      <motion.div
        variants={heroCardsContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{
          once: true,
          amount: 0.2,
        }}
      >
        <Grid
          size={12}
          container
          spacing={4}
          sx={{
            minHeight: 200,
          }}
        >
          {cardData.map((card, index) => (
            <Grid
              key={index}
              size={{
                xs: 12,
                lg: 4,
              }}
              container
              spacing={0}
              component={motion.div}
              variants={heroCardItem}
              sx={{
                alignItems: "center",
                bgcolor: "white",
                py: 5,
                boxShadow: 2,
                borderRadius: 2,
                color: "black",
                transition: "all 0.3s ease",

                "&:hover": {
                  bgcolor: "secondary.main",
                  transform: "translateY(-8px)",

                  "& .card-title": {
                    color: "white",
                  },

                  "& .icon-box": {
                    bgcolor: "white",
                    color: "secondary.main",
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
                    transition: "all 0.3s ease",
                  }}
                >
                  <i
                    className={card.icon}
                    style={{
                      fontSize: 40,
                    }}
                  />
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
                onClick={card.onClick}
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
      </motion.div>
    </Container>
  );
}
