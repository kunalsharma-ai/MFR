"use client";
import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Button,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import MemberNotification from "./MemberNotification";
import MemberHeaderExtras from "./MemberHeaderExtras";
import { useMember } from "@/Context";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ExploreIcon from "@mui/icons-material/Explore";

export default function MemberHeader() {
  const [profileAnchorEl, setProfileAnchorEl] = React.useState(null);
  const [router, user] = [useRouter(), useMember()];
  const [isDark, setIsDark] = React.useState(false);
  return (
    <div>
      {" "}
      <AppBar
        position="fixed"
        sx={{
          boxShadow: 3,
          pt: 1,
          // color: "black",
          width: "100vw",
          zIndex: 1201,
          minHeight: "70px",
          bgcolor: "white",
          // bgcolor: "#044236",
          // bgcolor: "#24292e",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "70px",
            p: 0,
            pr: 3,
          }}
        >
          <Box
            sx={{ cursor: "pointer" }}
            onClick={async (e) => {
              router.push(`/member/dashboard`);
            }}
          >
            <Box
              component="img"
              src="/images/logo/logo.png"
              alt="logo"
              height="60px"
              width="60px"
              sx={{
                ml: 2,
                mb: 1,
                // filter: "brightness(0) saturate(100%) invert(100%)",
                cursor: "pointer",
                display: { xs: "block", sm: "none" },
              }}
              onClick={() => {
                router.push("/member/dashboard");
              }}
            />{" "}
            <Box
              sx={{
                position: "relative",
                cursor: "pointer",
                scale: 1.1,
                display: { xs: "none", sm: "block" },
                marginRight: { lg: "50px" },
              }}
              onClick={() => {
                router.push("/member/dashboard");
              }}
            >
              <Box
                component="img"
                src="/images/logo/mfr-logo.png"
                alt="logo"
                width={220}
                //  width={220}
                // style={{ filter: "brightness(0) saturate(100%) invert(100%)"}}
                // width={{ xs: "180px", sm: "225px" }}
              />
              {/* <Box
                component="img"
                src="/imagesmfr/dol-sign.gif"
                alt="logo"
                width={{ xs: 15, md: 20 }}
                sx={{ position: "absolute", right: -6.5 }}
              /> */}
            </Box>
          </Box>
          <Box
            display={"flex"}
            alignItems="center"
            gap={{ xs: 0, md: 2 }}
            pb={1}
          >
            <MemberHeaderExtras setIsDark={setIsDark} />
            <QualityScore
              value={user?.qualityScore ?? 0}
              total={user?.qualityScoreTotal ?? 0}
              isDark={isDark}
            />
            <MemberNotification />

            <Button
              onClick={(event) => setProfileAnchorEl(event.currentTarget)}
              color="inherit"
              sx={{ textTransform: "none" }}
            >
              <Avatar
                src={user?.profilePicture || ""}
                alt={"User photo"}
                sx={{
                  bgcolor: user?.profilePicture
                    ? "transparent"
                    : "primary.main",
                  height: "45px",
                  width: "45px",
                  cursor: "pointer",
                }}
              />
              <Typography
                sx={{
                  ml: 1,
                  display: { xs: "none", lg: "block" },
                  fontSize: "16px",
                  color: "text.primary",
                  fontWeight: 500,
                }}
              >
                {user?.name?.first ?? "User"}
              </Typography>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={() => setProfileAnchorEl(null)}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        PaperProps={{
          sx: {
            color: "black",
            width: 150,
            color: "white",
            boxShadow: 24,
            mt: 1.5,
            overflow: "visible",
          },
        }}
      >
        {user?.navbar?.map((link) => (
          <MenuItem
            key={link?.text}
            onClick={() => {
              setProfileAnchorEl(null);
              router.replace(link?.link ?? "/");
            }}
            sx={{ gap: 1, px: 3, py: 1, color: "black", fontWeight: 500 }}
          >
            {link?.icon && <i className={link.icon} />}
            {link?.text}
          </MenuItem>
        ))}
        <MenuItem
          onClick={async () => {
            setProfileAnchorEl(null);
            user.Logout();
          }}
          sx={{
            gap: 1,
            px: 3,
            py: 1,
            borderTop: "1px solid whitesmoke",
            color: "black",
            fontWeight: 500,
          }}
        >
          <i className="icon-power" />
          Logout
        </MenuItem>
      </Menu>
    </div>
  );
}

function getProgressColor(value, total) {
  const ratio = Math.max(0, Math.min(1, value / total));
  const r = Math.round(255 * (1 - ratio));
  const g = Math.round(255 * ratio);
  const b = 0;
  return `rgb(${r}, ${g}, ${b})`;
}

const QualityScore = ({ value, total, isDark }) => {
  const percentage = Math.min(100, (value / total) * 100 || 0);
  const progressColor = getProgressColor(value, total);

  const containerStyles = isDark
    ? {
        background: "linear-gradient(135deg, #1e2a3a 0%, #16202e 100%)",
        border: "1.5px solid rgba(140, 170, 220, 0.25)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
      }
    : {
        background: "linear-gradient(135deg, #eef4fb 0%, #f5f0f8 100%)",
        border: "1.5px solid rgba(255,255,255,0.85)",
        boxShadow: "0 4px 14px rgba(100, 120, 160, 0.12)",
      };

  const labelColor = isDark ? "#a8c0d8" : "#5a6b7d";
  const numberColor = isDark ? "#e8f0fa" : "#1a2d40";
  const totalColor = isDark ? "#8aa0b8" : "#687987";
  const trackColor = isDark
    ? "rgba(100, 130, 170, 0.25)"
    : "rgba(180, 190, 210, 0.35)";

  return (
    <Box
      display={{ xs: "none", md: "flex" }}
      alignItems="center"
      gap={2.5}
      sx={{
        px: 2.5,
        py: 1.25,
        minWidth: 260,
        borderRadius: "100px",
        "&:hover": {
          transform: "translateY(-1px)",
        },
        ...containerStyles,
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          width: 48,
          height: 48,
        }}
      >
        <CircularProgress
          variant="determinate"
          value={100}
          size={48}
          thickness={3.5}
          sx={{
            color: trackColor,
            position: "absolute",
          }}
        />
        <CircularProgress
          variant="determinate"
          value={percentage}
          size={48}
          thickness={3.5}
          sx={{
            color: progressColor || "#9b7bff",
            position: "absolute",
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
            },
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FavoriteIcon sx={{ fontSize: 20, color: "#e74c6b" }} />
        </Box>
      </Box>
      <Box
        sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1.6,
            lineHeight: 1.1,
            color: labelColor,
            textTransform: "uppercase",
          }}
        >
          QUALITY
        </Typography>

        <Typography
          sx={{
            fontSize: 32,
            fontWeight: 800,
            lineHeight: 1.05,
            color: numberColor,
          }}
        >
          {value}
          <Box
            component="span"
            sx={{
              fontSize: 16,
              fontWeight: 500,
              color: totalColor,
              ml: 0.5,
            }}
          >
            / {total}
          </Box>
        </Typography>
      </Box>

      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark
            ? "radial-gradient(circle at 35% 30%, #4a3f20, #3a3018)"
            : "radial-gradient(circle at 35% 30%, #fff9e8, #f0d9a0)",
          boxShadow: isDark
            ? "0 2px 8px rgba(0,0,0,0.4)"
            : "0 2px 6px rgba(180, 140, 40, 0.2)",
          flexShrink: 0,
        }}
      >
        <ExploreIcon
          sx={{
            fontSize: 22,
            color: isDark ? "#e8c86a" : "#c9a227",
          }}
        />
      </Box>
    </Box>
  );
};
