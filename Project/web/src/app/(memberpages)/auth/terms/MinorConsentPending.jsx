"use client";

import React from "react";
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useMember } from "@/Context";

export default function MinorConsentPending() {
  const user = useMember();

  const [showPendingMessage, setShowPendingMessage] = React.useState(false);
  const [isApproved, setIsApproved] = React.useState(false);

  return (
    <Box
      sx={{
        width: { xs: "92vw", sm: 650, md: 720 },
        mx: "auto",
        p: { xs: 3, sm: 4 },
        textAlign: "center",
        bgcolor: "white",
        // borderRadius: 3,
        // border: (theme) =>
        //   `1px solid ${theme.palette.secondary.main}`,
        // boxShadow: 8,
      }}
    >
      <Typography
        variant="h5"
        fontWeight={600}
        mb={2}
        sx={{
          color: "secondary.main",
        }}
      >
        {isApproved
          ? "Parent Approval Confirmed"
          : "Parent/Guardian Approval Required"}
      </Typography>

      <Typography variant="body1" color="text.secondary">
        {isApproved
          ? "Your parent or legal guardian has approved your account."
          : "You are a minor. To continue, we need permission from your parent or legal guardian."}
      </Typography>

      {!isApproved && (
        <>
          <Typography variant="body1" color="text.secondary" mt={2}>
            We have sent an email to your parent/guardian with a secure
            link to review and accept the Terms & Conditions.
          </Typography>

          {user?.parent?.email && (
            <Typography
              variant="body2"
              fontWeight={600}
              mt={2}
              sx={{ color: "primary.main" }}
            >
              Consent email sent to: {user.parent.email}
            </Typography>
          )}

          <Typography variant="body1" color="text.secondary" mt={2}>
            Once your parent/guardian provides consent, you will be able
            to continue.
          </Typography>
        </>
      )}

      {isApproved && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: "#8cb2f333",
            // border: "1px solid",
            // borderColor: "primary.main",
          }}
        >
          <Typography
            variant="body1"
            fontWeight={600}
            sx={{ color: "primary.main" }}
          >
            You can now continue and participate in available surveys.
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        sx={{
          mt: 3,
          px: 3,
          fontWeight: 600,
          color: "white",
        }}
        onClick={() => {
          if (isApproved) {
            // BACKEND TODO:
            // Redirect the minor to dashboard/survey page
            // after parent consent has been approved.
            //
            // Example:
            // router.push("/dashboard");

            return;
          }

          // FRONTEND DEMO:
          // Currently showing pending approval message.
          //
          // BACKEND TODO:
          // Call GET /api/v1/me/parent-consent-status here.
          //
          // If consentStatus === "approved":
          // setIsApproved(true);
          //
          // Otherwise:
          // setShowPendingMessage(true);

          setShowPendingMessage(true);
        }}
      >
        {isApproved ? "Continue to Surveys" : "Check Approval Status"}
      </Button>

      <Dialog
        open={showPendingMessage}
        onClose={() => setShowPendingMessage(false)}
      >
        <DialogTitle
          sx={{
            color: "secondary.main",
            fontWeight: 600,
          }}
        >
          Approval Pending
        </DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Your parent or legal guardian has not approved your account yet.
            Please ask them to review the consent email and accept the Terms
            & Conditions.
          </Typography>

          {/* BACKEND TODO:
              This message will be shown based on the latest
              parent consent status returned by the backend.
          */}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowPendingMessage(false)}
            variant="contained"
            color="primary"
            sx={{
              fontWeight: 600,
              color: "white",
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}