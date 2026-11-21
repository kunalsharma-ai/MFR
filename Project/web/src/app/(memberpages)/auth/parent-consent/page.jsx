"use client";
// Retired: parent / guardian permission for the Teen Panel now happens on the main site at /teen/parent, reached only
// through the secure, time-limited YES / NO link in the guardian's email (api: /api/v1/teen). The old links on this page
// carried the member id and a code in the URL and called member endpoints that are now locked down, so this page only
// explains where to go. It reads nothing from the URL and calls no API.
import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfrequentrewards.com").replace(/\/$/, "");

export default function ParentConsentMoved() {
  return (
    <Box sx={{ bgcolor: "#f4f6fb", minHeight: "100vh", display: "flex", alignItems: "center", py: 4 }}>
      <Container maxWidth="sm">
        <Box sx={{ bgcolor: "#fff", borderRadius: 4, p: { xs: 3, sm: 5 }, boxShadow: "0 20px 50px rgba(20,30,70,.08)", border: "1px solid #e3e6f2" }}>
          <Typography variant="overline" sx={{ color: "#3b5bdb", fontWeight: 700 }}>For parents and legal guardians</Typography>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mt: 1, mb: 2 }}>
            This permission link has been replaced
          </Typography>
          <Typography sx={{ color: "#4a5170", mb: 2 }}>
            We now send every parent or legal guardian a new, secure email with YES and NO buttons. Please open the
            newest email from MyFrequentRewards about your teen and choose there.
          </Typography>
          <Typography sx={{ color: "#4a5170", mb: 3 }}>
            If that link has expired or you can't find the email, ask for a fresh one. We'll send it to the address your
            teen gave us.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button variant="contained" href={`${SITE}/teen/renew`} sx={{ borderRadius: 99, textTransform: "none", fontWeight: 700 }}>
              Send me a new link
            </Button>
            <Button variant="outlined" href={`${SITE}/teen/terms`} sx={{ borderRadius: 99, textTransform: "none", fontWeight: 700 }}>
              Read the Teen research terms
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: "#8790b0", mt: 3 }}>
            Questions? Email support@myfrequentrewards.com
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
