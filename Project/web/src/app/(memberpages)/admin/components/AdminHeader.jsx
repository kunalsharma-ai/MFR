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
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useMember } from "@/Context";
import AdminNotification from "./AdminNotification";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";

export default function AdminHeader() {
  const [profileAnchorEl, setProfileAnchorEl] = React.useState(null);
  const me = useMember();
  const router = useRouter();

  // if (!me) return <LoadingOverlay />;
  return (
    <div>
      {" "}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: "#fff",
          boxShadow: 3,
          pt: 1,
          // color: "white",
          width: "100vw",
          zIndex: 1201,
          minHeight: "70px",

          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "70px",
          }}
        >
          <Box
            sx={{ cursor: "pointer" }}
            onClick={async (e) => {
              router.push(`/admin/dashboard`);
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
                router.push("/admin/dashboard");
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
                router.push("/admin/dashboard");
              }}
            >
              <Box
                component="img"
                src="/images/logo/mfr/200w.webp"
                alt="logo"
                 
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
            <AdminNotification />

            <Button
              onClick={(event) => setProfileAnchorEl(event.currentTarget)}
              color="inherit"
              sx={{ textTransform: "none" }}
            >
              <Avatar
                alt="User photo"
                src={me?.profilePicture ?? ""}
                sx={{
                  bgcolor: me?.profilePicture ? "transparent" : "primary.main",
                  height: "45px",
                  width: "45px",
                }}
              />
              <Typography fontSize={"16px"} fontWeight={500} ml={1} color={"text.primary"} display={{ xs: "none", lg: "block" }}>
                {me?.name?.first ?? "User"}
              </Typography>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={() => setProfileAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
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
        {me?.navbar?.map((link) => (
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
            me.Logout();
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
