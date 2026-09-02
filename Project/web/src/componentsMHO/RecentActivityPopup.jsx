"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Box, IconButton, Paper, Typography } from "@mui/material";
import {
  Close,
  AccountBalanceWallet,
  AssignmentTurnedIn,
  Stars,
  Verified,
} from "@mui/icons-material";

const MotionPaper = motion.create(Paper);

const names = [
  // International
  "Charlotte",
  "Henry",
  "Evelyn",
  "William",
  "Harper",
  "James",
  "Eleanor",
  "Benjamin",
  "Grace",
  "Theodore",
  "Violet",
  "Jack",
  "Penelope",
  "Arthur",
  "Hazel",
  "Lucas",
  "Ivy",
  "Elijah",
  "Aurora",
  "Charlie",
  "Willow",
  "Mason",
  "Lillian",
  "Logan",
  "Aria",
  "Jacob",
  "Ellie",
  "Hudson",
  "Rose",
  "Wyatt",
  "Nora",
  "Caleb",
  "Isla",
  "Owen",
  "Lucy",
  "Carter",
  "Ruby",
  "Grayson",
  "Evelyn",
  "Leo",
  "Claire",
  "Dylan",
  "Audrey",
  "Luke",
  "Alice",
  "Isaac",
  "Stella",
  "Matthew",
  "Molly",
  "Ryan",
  "Lydia",
  "Nathan",
  "Eliza",
  "Samuel",
  "Piper",
  "Daniel",
  "Sienna",
  "Joseph",
  "Sadie",
  "David",
  "Clara",
  "Andrew",
  "Madeline",
  "Thomas",
  "Julia",
  "Christopher",
  "Bella",
  "Joshua",
  "Naomi",
  "Anthony",
  "Elena",
  "Charles",
  "Maya",
  "Nicholas",
  "Sarah",
  "Jonathan",
  "Amelia",

  // Indian
  "Vihaan",
  "Diya",
  "Kabir",
  "Anika",
  "Reyansh",
  "Myra",
  "Ayaan",
  "Kiara",
  "Atharv",
  "Anvi",
  "Arnav",
  "Sara",
  "Vivaan",
  "Aadhya",
  "Shaurya",
  "Avni",
  "Krishna",
  "Navya",
  "Ishaan",
  "Anushka",
  "Aryan",
  "Mahika",
  "Laksh",
  "Pari",
  "Rudra",
  "Aarohi",
  "Devansh",
  "Vanya",
  "Dhruv",
  "Samaira",
  "Reyansh",
  "Myra",
  "Kiaan",
  "Ira",
  "Aarush",
  "Kiara",
  "Ved",
  "Rhea",
  "Yuvaan",
  "Aanya",
  "Neil",
  "Mishka",
  "Advait",
  "Navya",
  "Arhaan",
  "Anaya",
  "Vivaan",
  "Tara",
  "Krish",
  "Aahana",
  "Ritvik",
  "Siya",
  "Pranav",
  "Myra",
  "Veer",
  "Aaradhya",
  "Raghav",
  "Ishani",
  "Atharv",
  "Mira",
  "Kartik",
  "Aditi",
  "Rohan",
  "Shanaya",
  "Manav",
  "Ishita",
  "Kush",
  "Aarvi",
  "Nivaan",
  "Meher",
  "Yash",
  "Avika",
  "Rudransh",
  "Saanvi",
  "Keshav",
  "Navika",
];

const activityTypes = [
  {
    action: "just claimed",
    values: [
      "1,000 points",
      "1,200 points",
      "1,500 points",
      "1,800 points",
      "2,000 points",
    ],
    description: "Points claimed",
    icon: AccountBalanceWallet,
  },
  {
    action: "completed a survey and received",
    values: [
      "600 points",
      "800 points",
      "1,000 points",
      "1,200 points",
      "1,500 points",
      "1,800 points",
    ],
    description: "Survey completed",
    icon: AssignmentTurnedIn,
  },
  {
    action: "just earned",
    values: [
      "400 points",
      "600 points",
      "800 points",
      "1,000 points",
      "1,200 points",
      "1,400 points",
    ],
    description: "Reward earned",
    icon: Stars,
  },
];

const DISPLAY_TIME = 7000;
const QUEUE_SIZE = 25;

const randomDelay = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getInitialDelay = () => randomDelay(4000, 10000);

const getBetweenDelay = () => randomDelay(8000, 20000);

const randomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateActivity = () => {
  const person = randomItem(names);
  const activity = randomItem(activityTypes);
  const value = randomItem(activity.values);

  return {
    name: person,
    action: activity.action,
    value,
    description: activity.description,
    icon: activity.icon,
  };
};

const generateQueue = (count = QUEUE_SIZE) => {
  const queue = [];
  const used = new Set();

  while (queue.length < count) {
    const activity = generateActivity();

    const key = `${activity.name}-${activity.action}-${activity.value}`;

    if (!used.has(key)) {
      used.add(key);
      queue.push(activity);
    }
  }

  return queue;
};

export default function RecentActivityPopup({ ToTopButtonVisible }) {
  const pathname = usePathname();

  const [activityQueue, setActivityQueue] = useState(() => generateQueue());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setVisible(false);
      return;
    }

    let showTimer;
    let hideTimer;
    let nextTimer;

    const showActivity = () => {
      setVisible(true);
      hideTimer = setTimeout(() => {
        setVisible(false);
        nextTimer = setTimeout(() => {
          setCurrentIndex((prev) => {
            const nextIndex = prev + 1;
            if (nextIndex >= activityQueue.length) {
              setActivityQueue(generateQueue());
              return 0;
            }
            return nextIndex;
          });
          showActivity();
        }, getBetweenDelay());
      }, DISPLAY_TIME);
    };
    showTimer = setTimeout(showActivity, getInitialDelay());
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [pathname, activityQueue.length]);
  if (pathname !== "/") {
    return null;
  }
  const current = activityQueue[currentIndex];
  if (!current) {
    return null;
  }
  const ActivityIcon = current.icon;
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <MotionPaper
          key={`${current.name}-${current.action}-${current.value}`}
          elevation={0}
          initial={{
            opacity: 0,
            x: -80,
            y: 25,
            scale: 0.94,
          }}
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            x: -80,
            y: 25,
            scale: 0.94,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 28,
            mass: 0.8,
          }}
          sx={{
            position: "fixed",
            left: {
              xs: 12,
              sm: ToTopButtonVisible ? 74 : 14,
            },
            bottom: {
              xs: 12,
              sm: 14,
            },
            width: {
              xs: "calc(100vw - 24px)",
              sm: 380,
            },
            maxWidth: "380px",
            zIndex: 999,
            overflow: "hidden",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #FFFFFF 0%, #FFF9F4 100%)",
            border: "1px solid rgba(0, 27, 102, 0.14)",
            boxShadow:
              "0 16px 45px rgba(0, 27, 102, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Decorative glow */}
          <Box
            sx={{
              position: "absolute",
              top: -45,
              right: -35,
              width: 110,
              height: 110,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(254,126,0,0.18) 0%, rgba(254,126,0,0) 70%)",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              bottom: -55,
              left: -45,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0,27,102,0.10) 0%, rgba(0,27,102,0) 70%)",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.75,
              pr: 1.25,
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Activity icon */}
            <Box
              sx={{
                position: "relative",
                flexShrink: 0,
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.06, 1],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    background:
                      "linear-gradient(135deg, #001B66 0%, #063686 100%)",
                    color: "#fff",
                    boxShadow: "0 6px 18px rgba(0, 27, 102, 0.28)",
                  }}
                >
                  <ActivityIcon sx={{ fontSize: 24 }} />
                </Avatar>
              </motion.div>

              {/* Verified badge */}
              <Box
                sx={{
                  position: "absolute",
                  right: -2,
                  bottom: -2,
                  width: 17,
                  height: 17,
                  borderRadius: "50%",
                  backgroundColor: "#fe7e00",
                  border: "2px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Verified
                  sx={{
                    fontSize: 11,
                    color: "#fff",
                  }}
                />
              </Box>
            </Box>

            {/* Activity content */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  mb: 0.4,
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#fe7e00",
                    boxShadow: "0 0 0 4px rgba(254,126,0,0.10)",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 10.5,
                    lineHeight: 1,
                    fontWeight: 800,
                    letterSpacing: "0.8px",
                    color: "#001B66",
                    textTransform: "uppercase",
                  }}
                >
                  Rewards activity
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  color: "#263238",
                  fontWeight: 500,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  {current.name}
                </Box>{" "}
                {current.action}
              </Typography>

              {/* Reward value */}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  mt: 0.6,
                  px: 1,
                  py: 0.35,
                  borderRadius: "6px",
                  backgroundColor: "#FFD4AD",
                  border: "1px solid rgba(254,126,0,0.20)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#001B66",
                    lineHeight: 1.2,
                  }}
                >
                  {current.value}
                </Typography>
              </Box>
            </Box>

            {/* Close */}
            <IconButton
              onClick={() => setVisible(false)}
              size="small"
              sx={{
                alignSelf: "flex-start",
                mt: -0.5,
                color: "#9AA5B1",
                "&:hover": {
                  color: "#001B66",
                  backgroundColor: "#FFD4AD",
                },
              }}
            >
              <Close sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>

          {/* Progress bar */}
          <Box
            sx={{
              height: 3,
              backgroundColor: "#FFD4AD",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{
                duration: DISPLAY_TIME / 1000,
                ease: "linear",
              }}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #001B66 0%, #fe7e00 100%)",
                borderRadius: "0 3px 3px 0",
              }}
            />
          </Box>
        </MotionPaper>
      )}
    </AnimatePresence>
  );
}
