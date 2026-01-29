"use client";
import React, { Suspense } from "react";
import { Fab, Box,Zoom } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import Footer from "@/componentsMHO/Footer";
import Header from "@/componentsMHO/Header";
import SignUp from "@/componentsMHO/SignUp";
import Login from "@/componentsMHO/Login";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";
import { ContextProviders } from "@/Context";

export default function MainLayout({ children }) {
  const [visible, setVisible] = React.useState(false);
  const [openLogin, setOpenLogin] = React.useState(false);
  const [openSignUp, setOpenSignUp] = React.useState(false);

  React.useEffect(() => {
    const scrollContainer = document.getElementById("scroll-container");
    if (!scrollContainer) return;

    const toggleVisibility = () => {
      setVisible(scrollContainer.scrollTop > 300);
    };

    scrollContainer.addEventListener("scroll", toggleVisibility);
    return () =>
      scrollContainer.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.getElementById("scroll-container");
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };
  return (
    <div
      id="scroll-container"
      style={ {
        height: "100vh",
        overflowY: "auto",
      } }
    >
      { " " }
      <ContextProviders>
        <React.Suspense fallback={<Box sx={{width:"100%", height:{xs:"70px",lg:"78px"}}}/>}>
        <Header open={ openLogin } setOpen={ setOpenLogin } />
        </React.Suspense>
      </ContextProviders>
      <main>{ children }</main>
      <React.Suspense fallback={ <></> }>
        <Footer />
      </React.Suspense>
      <ContextProviders>
        <SignUp
          open={ openSignUp }
          onClose={ () => {
            setOpenSignUp(false);
          } }
          setOpenLogin={ setOpenLogin }
        />
        <Login
          open={ openLogin }
          setOpenSignUp={ setOpenSignUp }
          onClose={ () => {
            setOpenLogin(false);
          } }
        />
      </ContextProviders>
      <Zoom in={ visible } unmountOnExit>
        <Fab
          size="medium"
          color="primary"
          onClick={ scrollToTop }
          sx={ {
            position: "fixed",
            bottom: 35,
            left: 35,
            boxShadow: 4,
            zIndex: 999,
            color: "white",
          } }
          aria-label="scroll to top button"
        >
          <KeyboardArrowUpIcon sx={ { fontSize: "30px" } } />
        </Fab>
      </Zoom>
    </div>
  );
}
