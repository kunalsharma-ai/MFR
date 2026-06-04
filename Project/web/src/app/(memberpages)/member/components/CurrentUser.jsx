"use client";

import React from "react";
import { Avatar, Box, Button, Grid, Typography } from "@mui/material";
import { useMember } from "@/Context";

const maskEmail = (email) => {
  if (!email) return "";

  const [name, domain] = email.split("@");
  if (!domain) return "xxxx";

  return `${name.slice(0, 2)}xxxx@${domain}`;
};


export default function CurrentUser() {
  const [user] = [useMember()];
  // todo: change profile picture
  return (
    <Grid
      size={{ xs: 12, md: 6 }}
      container
      alignItems={"center"}
      justifyContent={{ xs: "center", md: "flex-start" }}
      spacing={2}
      pb={{ xs: 2, md: 0 }}
      mb={{ xs: 2, md: 0 }}
      borderBottom={{ xs: `1px solid #e0e0e0`, md: "none" }}
    >
      <Avatar
        src={user?.profilePicture || ""}
        alt={user?.name?.first ?? "U"}
        sx={{
          height: { xs: "50px", lg: "30px" },
          width: { xs: "50px", lg: "30px" },
          fontSize: "22px",
          bgcolor: user?.profilePicture ? "transparent" : "primary.main",
        }}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: { xs: "center", sm: "flex-start" },
        }}
      >
        <Typography
          fontSize={{ xs: "16px", md: "14px" }}
          fontWeight={600}
          color="primary.main"
        >
          {user?.fullName}
        </Typography>
        <Typography fontSize={{ xs: "14px", lg: "11px" }} fontWeight={500} sx={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: { xs: "270px", lg: "170px" }}}>
          {maskEmail(user?.mail)}
        </Typography>
        {/* <Typography
          fontSize="13px"
          color="primary.main"
          fontWeight={600}
          textTransform="capitalize"
        >
          {user?.category}
        </Typography> */}
      </Box>
    </Grid>
  );
}
