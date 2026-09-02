"use client";
import React from "react";
import {
  Avatar,
  Box,
  Button,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Typography,
  InputAdornment,
  Tooltip,
  Tabs,
  Tab,
  Fade,
  Collapse,
  Rating,
  Chip,
} from "@mui/material";
import {
  Male as MaleIcon,
  Female as FemaleIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  WhatsApp as WhatsAppIcon,
  X as XIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import PopUp from "@/componentsMHO/PopUp";
import { useMember } from "@/Context";
import { api, Page } from "@/util";
export default function Payment() {
  const [openPayment, setOpenPayment] = React.useState(false);
  const [selectedMethod, setSelectedMethod] = React.useState();
  const [payment, setPayment] = React.useState({});
  const member = useMember();

  const paymentMethods = [
    { name: "PayPal", icon: "/images/payment/paypal.png" },
    { name: "Wire Transfer", icon: "/images/payment/wire-transfer.png" },
    { name: "Amazon", icon: "/images/payment/amazone.png" },
    { name: "UPI", icon: "/images/payment/upi.png" },
  ];

  const handleSave = async (method, value) => {
    let resp = await api.patch("/api/v1/me/payment-method", {
      method,
      details: {
        ...value,
      },
    });
    setPayment({ method, value });
    setOpenPayment(false);
  };
  React.useEffect(() => {
    if (!member) return;
    setPayment({
      ...member.paymentMethod,
      value: member?.paymentMethod?.details,
    });
  }, [member]);

  return (
    <Grid
      size={{ xs: 12, lg: 6 }}
      container
      spacing={2}
      justifyContent="center"
    >
      {/* Header */}
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={1}
        pt={1}
        minHeight={"46px"}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 600,
            borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`,
            pb: 0.5,
          }}
        >
          Payment Method
        </Typography>
        {payment?.method && (
          <IconButton
            onClick={() => setOpenPayment(true)}
            sx={{ color: "secondary.main" }}
          >
            <EditIcon sx={{ fontSize: 22 }} />
          </IconButton>
        )}
      </Box>

      {/* Payment display */}
      <Grid
        container
        size={12}
        direction="column"
        spacing={0}
        px={2}
        py={2}
        sx={{
          border: (theme) => `1px solid ${theme.palette.primary.main}`,
          bgcolor: (theme) => theme.palette.cardbg.main,
          color: (theme) => theme.palette.cardtext.main,
          borderRadius: 2,
        }}
      >
        {payment?.method ? (
          <Grid container size={12} alignItems="center" py={{ xs: 0, md: 1 }}>
            <Typography
              width={{ xs: "100%", lg: "40%" }}
              fontWeight={payment.method === "Wire Transfer" ? 600 : 500}
            >
              {payment.method}:
            </Typography>
            {["PayPal", "UPI", "Amazon"].includes(payment?.method) ? (
              <Typography color="secondary" fontWeight={500}>
                {payment?.value?.account}
              </Typography>
            ) : (
              <Grid size={12} mt={1.5}>
                <Grid
                  size={12}
                  container
                  alignItems="center"
                  borderBottom={"2px solid #fff"}
                  py={1}
                >
                  <Typography
                    width={{ xs: "100%", lg: "40%" }}
                    fontWeight={500}
                  >
                    Bank:
                  </Typography>
                  <Typography
                    component="span"
                    color="secondary"
                    fontWeight={500}
                  >
                    {payment?.value?.bank}
                  </Typography>{" "}
                </Grid>
                <Grid
                  size={12}
                  container
                  alignItems="center"
                  borderBottom={"2px solid #fff"}
                  py={1}
                >
                  <Typography
                    width={{ xs: "100%", lg: "40%" }}
                    fontWeight={500}
                  >
                    IFSC/IBAN/SWIFT Code:
                  </Typography>
                  <Typography
                    component="span"
                    color="secondary"
                    fontWeight={500}
                  >
                    {payment?.value?.ifsc}
                  </Typography>{" "}
                </Grid>
                <Grid size={12} container alignItems="center" py={1}>
                  <Typography
                    width={{ xs: "100%", lg: "40%" }}
                    fontWeight={500}
                  >
                    Account Number:
                  </Typography>
                  <Typography
                    component="span"
                    color="secondary"
                    fontWeight={500}
                  >
                    {payment?.value?.account}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Grid>
        ) : (
          <Typography py={1}>
            No Payment method selected yet.{" "}
            <Typography
              color="secondary"
              component={"span"}
              fontWeight={600}
              sx={{ cursor: "pointer" }}
              onClick={() => setOpenPayment(true)}
            >
              Click to add
            </Typography>
          </Typography>
        )}
      </Grid>

      {/* Payment Popup */}
      <PopUp
        title="Select Payment Method"
        maxWidth="md"
        open={openPayment}
        onClose={() => setOpenPayment(false)}
      >
        <Grid
          size={12}
          container
          alignItems="center"
          sx={{ bgcolor: "#f1f4f9" }}
        >
          {/* Payment options */}
          <Grid
            container
            size={12}
            alignItems="center"
            spacing={3}
            justifyContent="space-evenly"
            pt={5}
            pb={3}
          >
            <RadioGroup
              row
              value={selectedMethod}
              onChange={(event) => setSelectedMethod(event.target.value)}
              style={{ justifyContent: "space-evenly", width: "100%" }}
            >
              {paymentMethods.map((method, index) => (
                <FormControlLabel
                  key={index}
                  value={method.name}
                  control={<Radio />}
                  label={
                    <Box
                      component="img"
                      src={method.icon}
                      alt={method.name}
                      sx={{
                        height: 63,
                        width: 100,
                        mr: 2,
                        p: 1,
                        borderRadius: 2,
                        cursor: "pointer",
                        border:
                          selectedMethod === method.name
                            ? "2px solid #0c5adb"
                            : "2px solid transparent",
                        boxShadow:
                          selectedMethod === method.name
                            ? "0 0 8px #063686"
                            : "none",
                        transition: "0.2s",
                      }}
                    />
                  }
                />
              ))}
            </RadioGroup>
          </Grid>

          {/* Dynamic input form */}
          <Grid size={12} container py={2}>
            {/* PayPal */}
            <Collapse
              in={selectedMethod === "PayPal"}
              unmountOnExit
              sx={{ width: "100%" }}
            >
              <Grid
                container
                size={12}
                px={2}
                justifyContent="center"
                spacing={0}
              >
                <Typography
                  mb={1}
                  fontSize={16}
                  fontWeight={600}
                  color="secondary"
                >
                  Enter your PayPal Email
                </Typography>
                <Page.Input
                  value={
                    payment.method === "PayPal" ? payment?.value?.account : ""
                  }
                  onChange={(e) =>
                    setPayment({
                      method: "PayPal",
                      value: { account: e.target.value },
                    })
                  }
                />
                <Button
                  onClick={() => handleSave("PayPal", payment.value)}
                  variant="contained"
                  color="secondary"
                  sx={{ my: 2, fontWeight: 600, color: "white", px: 2 }}
                >
                  Save
                </Button>
              </Grid>
            </Collapse>

            {/* Wire Transfer */}
            <Collapse
              in={selectedMethod === "Wire Transfer"}
              unmountOnExit
              sx={{ width: "100%" }}
            >
              <Grid
                container
                size={12}
                px={2}
                justifyContent="center"
                spacing={2}
              >
                <Grid size={6} container spacing={0}>
                  <Typography fontSize={16} fontWeight={600} color="secondary">
                    Bank
                  </Typography>
                  <Page.Input
                    value={
                      payment.method === "Wire Transfer"
                        ? payment.value.bank || ""
                        : ""
                    }
                    onChange={(e) =>
                      setPayment((prev) => ({
                        method: "Wire Transfer",
                        value: { ...prev.value, bank: e.target.value },
                      }))
                    }
                  />
                </Grid>
                <Grid size={6} container spacing={0}>
                  <Typography fontSize={16} fontWeight={600} color="secondary">
                    Enter your IFSC/IBAN/SWIFT Code
                  </Typography>
                  <Page.Input
                    value={
                      payment.method === "Wire Transfer"
                        ? payment.value.ifsc || ""
                        : ""
                    }
                    onChange={(e) =>
                      setPayment((prev) => ({
                        method: "Wire Transfer",
                        value: { ...prev.value, ifsc: e.target.value },
                      }))
                    }
                  />
                </Grid>
                <Grid size={12} container spacing={0}>
                  <Typography fontSize={16} fontWeight={600} color="secondary">
                    Account Number
                  </Typography>
                  <Page.Input
                    value={
                      payment.method === "Wire Transfer"
                        ? (payment?.value?.account ?? "")
                        : ""
                    }
                    onChange={(e) =>
                      setPayment((prev) => ({
                        method: "Wire Transfer",
                        value: { ...prev.value, account: e.target.value },
                      }))
                    }
                  />
                </Grid>
                <Button
                  onClick={() => handleSave("Wire Transfer", payment.value)}
                  variant="contained"
                  color="secondary"
                  sx={{ my: 2, color: "white", px: 2, fontWeight: 600 }}
                >
                  Save
                </Button>
              </Grid>
            </Collapse>

            {/* Amazon */}
            <Collapse
              in={selectedMethod === "Amazon"}
              unmountOnExit
              sx={{ width: "100%" }}
            >
              <Grid
                container
                size={12}
                px={2}
                justifyContent="center"
                spacing={0}
              >
                <Typography
                  mb={1}
                  fontSize={16}
                  fontWeight={600}
                  color="secondary"
                >
                  Enter your Amazon Email
                </Typography>
                <Page.Input
                  value={
                    payment.method === "Amazon" ? payment?.value?.account : ""
                  }
                  onChange={(e) =>
                    setPayment({
                      method: "Amazon",
                      value: { account: e.target.value },
                    })
                  }
                />
                <Button
                  onClick={() => handleSave("Amazon", payment.value)}
                  variant="contained"
                  color="secondary"
                  sx={{ my: 2, fontWeight: 600, color: "white", px: 2 }}
                >
                  Save
                </Button>
              </Grid>
            </Collapse>

            {/* UPI */}
            <Collapse
              in={selectedMethod === "UPI"}
              unmountOnExit
              sx={{ width: "100%" }}
            >
              <Grid
                container
                size={12}
                px={2}
                justifyContent="center"
                spacing={0}
              >
                <Typography
                  mb={1}
                  fontSize={16}
                  fontWeight={600}
                  color="secondary"
                >
                  Enter your UPI ID
                </Typography>
                <Page.Input
                  value={
                    payment.method === "UPI" ? payment?.value?.account : ""
                  }
                  onChange={(e) =>
                    setPayment({
                      method: "UPI",
                      value: { account: e.target.value },
                    })
                  }
                />
                <Button
                  onClick={() => handleSave("UPI", payment.value)}
                  variant="contained"
                  color="secondary"
                  sx={{ my: 2, fontWeight: 600, color: "white", px: 2 }}
                >
                  Save
                </Button>
              </Grid>
            </Collapse>
          </Grid>
        </Grid>
      </PopUp>
    </Grid>
  );
  return (
    <Grid
      size={{ xs: 12, lg: 6 }}
      container
      spacing={2}
      justifyContent="center"
    >
      {/* Header */}
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={1}
        pt={1}
        minHeight={46}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 600,
            borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`,
            pb: 0.5,
          }}
        >
          Payment Method
        </Typography>
        {payment?.method && (
          <IconButton
            onClick={() => setOpenPayment(true)}
            sx={{ color: "secondary.main" }}
          >
            <EditIcon sx={{ fontSize: 22 }} />
          </IconButton>
        )}
      </Box>

      {/* Payment display */}
      <Grid
        container
        size={12}
        direction="column"
        spacing={0}
        px={2}
        py={2}
        sx={{
          border: (theme) => `1px solid ${theme.palette.primary.main}`,
          bgcolor: (theme) => theme.palette.cardbg.main,
          color: (theme) => theme.palette.cardtext.main,
          borderRadius: 2,
        }}
      >
        {payment?.method ? (
          <Grid container size={12} alignItems="center" py={{ xs: 0, md: 1 }}>
            <Typography
              width={{ xs: "100%", lg: "40%" }}
              fontWeight={payment.method === "Wire Transfer" ? 600 : 500}
            >
              {payment.method}:
            </Typography>
            {typeof payment.value === "string" ? (
              <Typography color="secondary" fontWeight={500}>
                {payment.value}
              </Typography>
            ) : (
              <Grid size={12} mt={1.5}>
                <Grid
                  size={12}
                  container
                  alignItems="center"
                  borderBottom={"1px solid #fff"}
                  py={1}
                >
                  <Typography
                    width={{ xs: "100%", lg: "40%" }}
                    fontWeight={500}
                  >
                    Bank:
                  </Typography>
                  <Typography
                    component="span"
                    color="secondary"
                    fontWeight={500}
                  >
                    {payment.value.bank}
                  </Typography>{" "}
                </Grid>
                <Grid
                  size={12}
                  container
                  alignItems="center"
                  borderBottom={"1px solid #fff"}
                  py={1}
                >
                  <Typography
                    width={{ xs: "100%", lg: "40%" }}
                    fontWeight={500}
                  >
                    IFSC/IBAN/SWIFT Code:
                  </Typography>
                  <Typography
                    component="span"
                    color="secondary"
                    fontWeight={500}
                  >
                    {payment.value.ifsc}
                  </Typography>{" "}
                </Grid>
                <Grid size={12} container alignItems="center" py={1}>
                  <Typography
                    width={{ xs: "100%", lg: "40%" }}
                    fontWeight={500}
                  >
                    Account Number:
                  </Typography>
                  <Typography
                    component="span"
                    color="secondary"
                    fontWeight={500}
                  >
                    {payment.value.accountNumber}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Grid>
        ) : (
          <Typography>
            No Payment method selected yet.{" "}
            <Typography
              color="secondary"
              component={"span"}
              fontWeight={600}
              sx={{ cursor: "pointer" }}
              onClick={() => setOpenPayment(true)}
            >
              Click to add
            </Typography>
          </Typography>
        )}
      </Grid>

      {/* Payment Popup */}
      <PopUp
        title="Select Payment Method"
        maxWidth="md"
        open={openPayment}
        onClose={() => setOpenPayment(false)}
      >
        <Grid
          size={12}
          container
          alignItems="center"
          sx={{
            bgcolor: (theme) => theme.palette.cardbg.main,
            color: (theme) => theme.palette.cardtext.main,
          }}
        >
          {/* Payment options */}
          <Grid
            container
            size={12}
            alignItems="center"
            spacing={3}
            justifyContent="space-evenly"
            pt={5}
            pb={3}
          >
            <RadioGroup
              row
              value={selectedMethod}
              onChange={(event) => setSelectedMethod(event.target.value)}
              style={{ justifyContent: "space-evenly", width: "100%" }}
            >
              {paymentMethods.map((method, index) => (
                <FormControlLabel
                  key={index}
                  value={method.name}
                  control={<Radio />}
                  label={
                    <Box
                      component="img"
                      src={method.icon}
                      alt={method.name}
                      sx={{
                        height: 63,
                        width: 100,
                        mr: 2,
                        p: 1,
                        borderRadius: 2,
                        cursor: "pointer",
                        border: (theme) =>
                          selectedMethod === method.name
                            ? `2px solid ${theme.palette.primary.main}`
                            : "2px solid transparent",
                        boxShadow: (theme) =>
                          selectedMethod === method.name
                            ? `0 0 8px ${theme.palette.secondary.main}`
                            : "none",
                        transition: "0.2s",
                      }}
                    />
                  }
                />
              ))}
            </RadioGroup>
          </Grid>

          {/* Dynamic input form */}
          <Grid size={12} container py={2}>
            {/* PayPal */}
            <Collapse
              in={selectedMethod === "PayPal"}
              unmountOnExit
              sx={{ width: "100%" }}
            >
              <Grid
                container
                size={12}
                px={2}
                justifyContent="center"
                spacing={0}
              >
                <Typography
                  mb={1}
                  fontSize={16}
                  fontWeight={600}
                  color="secondary"
                >
                  Enter your PayPal Email
                </Typography>
                <Page.Input
                  value={payment.method === "PayPal" ? payment.value : ""}
                  onChange={(e) =>
                    setPayment({ method: "PayPal", value: e.target.value })
                  }
                />
                <Button
                  onClick={() => handleSave("PayPal", payment.value)}
                  variant="contained"
                  color="secondary"
                  sx={{ my: 2, fontWeight: 600, color: "white", px: 2 }}
                >
                  Save
                </Button>
              </Grid>
            </Collapse>

            {/* Wire Transfer */}
            <Collapse
              in={selectedMethod === "Wire Transfer"}
              unmountOnExit
              sx={{ width: "100%" }}
            >
              <Grid
                container
                size={12}
                px={2}
                justifyContent="center"
                spacing={2}
              >
                <Grid size={6} container spacing={0}>
                  <Typography fontSize={16} fontWeight={600} color="secondary">
                    Enter your Bank Name
                  </Typography>
                  <Page.Input
                    value={
                      payment.method === "Wire Transfer"
                        ? payment.value.bank || ""
                        : ""
                    }
                    onChange={(e) =>
                      setPayment((prev) => ({
                        method: "Wire Transfer",
                        value: { ...prev.value, bank: e.target.value },
                      }))
                    }
                  />
                </Grid>
                <Grid size={6} container spacing={0}>
                  <Typography fontSize={16} fontWeight={600} color="secondary">
                    Enter your IFSC/IBAN/SWIFT Code
                  </Typography>
                  <Page.Input
                    value={
                      payment.method === "Wire Transfer"
                        ? payment.value.ifsc || ""
                        : ""
                    }
                    onChange={(e) =>
                      setPayment((prev) => ({
                        method: "Wire Transfer",
                        value: { ...prev.value, ifsc: e.target.value },
                      }))
                    }
                  />
                </Grid>
                <Grid size={12} container spacing={0}>
                  <Typography fontSize={16} fontWeight={600} color="secondary">
                    Enter your Account Number
                  </Typography>
                  <Page.Input
                    value={
                      payment.method === "Wire Transfer"
                        ? payment.value.accountNumber || ""
                        : ""
                    }
                    onChange={(e) =>
                      setPayment((prev) => ({
                        method: "Wire Transfer",
                        value: { ...prev.value, accountNumber: e.target.value },
                      }))
                    }
                  />
                </Grid>
                <Button
                  onClick={() => handleSave("Wire Transfer", payment.value)}
                  variant="contained"
                  color="secondary"
                  sx={{ my: 2, color: "white", px: 2, fontWeight: 600 }}
                >
                  Save
                </Button>
              </Grid>
            </Collapse>

            {/* Amazon */}
            <Collapse
              in={selectedMethod === "Amazon"}
              unmountOnExit
              sx={{ width: "100%" }}
            >
              <Grid
                container
                size={12}
                px={2}
                justifyContent="center"
                spacing={0}
              >
                <Typography
                  mb={1}
                  fontSize={16}
                  fontWeight={600}
                  color="secondary"
                >
                  Enter your Amazon Email
                </Typography>
                <Page.Input
                  value={payment.method === "Amazon" ? payment.value : ""}
                  onChange={(e) =>
                    setPayment({ method: "Amazon", value: e.target.value })
                  }
                />
                <Button
                  onClick={() => handleSave("Amazon", payment.value)}
                  variant="contained"
                  color="secondary"
                  sx={{ my: 2, fontWeight: 600, color: "white", px: 2 }}
                >
                  Save
                </Button>
              </Grid>
            </Collapse>

            {/* UPI */}
            <Collapse
              in={selectedMethod === "UPI"}
              unmountOnExit
              sx={{ width: "100%" }}
            >
              <Grid
                container
                size={12}
                px={2}
                justifyContent="center"
                spacing={0}
              >
                <Typography
                  mb={1}
                  fontSize={16}
                  fontWeight={600}
                  color="secondary"
                >
                  Enter your UPI ID
                </Typography>
                <Page.Input
                  value={payment.method === "UPI" ? payment.value : ""}
                  onChange={(e) =>
                    setPayment({ method: "UPI", value: e.target.value })
                  }
                />
                <Button
                  onClick={() => handleSave("UPI", payment.value)}
                  variant="contained"
                  color="secondary"
                  sx={{ my: 2, fontWeight: 600, color: "white", px: 2 }}
                >
                  Save
                </Button>
              </Grid>
            </Collapse>
          </Grid>
        </Grid>
      </PopUp>
    </Grid>
  );
}
