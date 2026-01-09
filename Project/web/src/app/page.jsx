"use client";
import React, { Suspense } from "react";
import { Fab, Zoom } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import AboutUs from "@/componentsMHO/AboutUs";
import Stats from "@/componentsMHO/Stats";
import HeroSection from "@/componentsMHO/HeroSection";
import Footer from "@/componentsMHO/Footer";
import Testimonial from "@/componentsMHO/Testimonial";
import Header from "@/componentsMHO/Header";
import SignUp from "@/componentsMHO/SignUp";
import Login from "@/componentsMHO/Login";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";
import { useQuery } from "@/Context";
import WhoWeAre from "@/componentsMHO/WhoWeAre";
import HowItWorks from "@/componentsMHO/HowItWorks";
import WhyChooseUs from "@/componentsMHO/WhyChooseUs";
import CommunityMember from "@/componentsMHO/CommunityMember";

export default function Home() {
  const query = useQuery();
  const howitworksRef = React.useRef(null);
  const whyusRef = React.useRef(null);
  const stepstojoinRef = React.useRef(null);
  const whoweareRef = React.useRef(null);

  const homeRef = React.useRef(null);
  const aboutRef = React.useRef(null);

  const [visible, setVisible] = React.useState(false);
  const [openLogin, setOpenLogin] = React.useState(false);
  const [openSignUp, setOpenSignUp] = React.useState(false);
  const [userType, setUserType] = React.useState(null);

  React.useEffect(() => {
    if (!query) return;
    if (![null, undefined].includes(query.signup)) {
      setOpenSignUp(true);
    }
  }, [query]);

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

  const sections = [
    { label: "ABOUT US", ref: aboutRef },
    { label: "HOW IT WORKS", ref: howitworksRef },
    { label: "WHY US", ref: whyusRef },
    { label: "STEPS TO JOIN", ref: stepstojoinRef },
    {
      label: "COVERAGE",
      external: true,
      href: "//panels.frequentresearch.com/",
    },
  ];

  return (
    <Suspense fallback={<LoadingOverlay />}>
      <div
        id="scroll-container"
        style={{
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <Header sections={sections} open={openLogin} setOpen={setOpenLogin} />
        <main>
          <div ref={homeRef} className="scroll-target">
            <HeroSection
              openSignUp={openSignUp}
              setOpenSignUp={setOpenSignUp}
              openLogin={openLogin}
              setOpenLogin={setOpenLogin}
            />
          </div>

          <div ref={aboutRef} className="scroll-target">
            <AboutUs />
          </div>
          <div ref={whoweareRef} className="scroll-target">
            <WhoWeAre />
          </div>
          <Stats />
          <div ref={howitworksRef} className="scroll-target">
            <HowItWorks />
          </div>
          <Testimonial />
          <div ref={whyusRef} className="scroll-target">
            <WhyChooseUs />
          </div>

          <div ref={stepstojoinRef} className="scroll-target">
            <CommunityMember />
          </div>
        </main>

        <Footer sections={sections} />
        <Zoom in={visible} unmountOnExit>
          <Fab
            size="medium"
            color="primary"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            sx={{
              position: "fixed",
              bottom: 35,
              left: 35,
              boxShadow: 4,
              zIndex: 999,
              color: "white",
            }}
          >
            <KeyboardArrowUpIcon sx={{ fontSize: "30px" }} />
          </Fab>
        </Zoom>
        <SignUp
        setOpenLogin={setOpenLogin}
          open={openSignUp}
          onClose={() => {
            setOpenSignUp(false);
          }}
        />
        <Login
          open={openLogin}
          setOpenSignUp={setOpenSignUp}
          onClose={() => {
            setOpenLogin(false);
          }}
        />
      </div>
    </Suspense>
  );
}
