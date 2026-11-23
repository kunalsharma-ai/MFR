"use client";
import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/util";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";
const MemberContext = createContext();
function notLoggedIn(pathname, router) {
  if (typeof pathname !== "string") return;
  return;
  if (pathname.startsWith("/member")) router.replace("/");
  if (pathname.startsWith("/admin")) router.replace("/");
}

async function loadUserInfo() {
  try {
    let temp = await api.get(`/api/v1/me`);
    if (temp.status === "error") throw new Error(temp.message);
    if ("data" in temp)
      return {
        ...temp.data,
        fullname: temp.data.fullName,
        firstname: temp?.data?.name?.first,
        lastname: temp?.data?.name?.last,
      };
  } catch (error) {
    throw new Error(error.message);
  }
}
class ValidUser {
  constructor(userinfo, router) {
    this.userinfo = userinfo;
    this.router = router;
  }
  termsAccepted() {
    // Teens never see the adult consent pages: their parent or guardian accepted the Teen terms (MINOR-2026.10)
    // before the teen could set a password, and the API records that as parent.consent === true.
    const cat = String(this.userinfo?.category || "");
    if (/minor/.test(cat) && this.userinfo?.parent?.consent === true) return true;
    return (
      "terms" in this.userinfo &&
      this.userinfo.terms instanceof Array &&
      this.userinfo.terms.length !== 0
    );
  }
  emailVerified() {
    return (
      "isVerified" in this.userinfo &&
      "email" in this.userinfo.isVerified &&
      this.userinfo.isVerified.email === "verified"
    );
  }
  async hasCompletedWelcomeSurvey() {
    return true;
    try {
      let temp = await api.post(`/api/v1/response`, {
        ["survey.slug"]: "welcome",
        status: "complete",
      });
      if (temp.status === "error") {
        return false;
      }
      return (
        "data" in temp && Array.isArray(temp.data) && temp.data.length === 1
      );
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  isAdmin() {
    return (
      "role" in this.userinfo && ["root", "admin"].includes(this.userinfo.role)
    );
  }
  // true: the member may stay on this page. false: they were sent somewhere else (the page must not show meanwhile)
  async allowAccess(pathname) {
    if (pathname.startsWith("/admin")) {
      if (!this.isAdmin()) { this.router.replace("/"); return false; }
    }
    if (pathname.startsWith("/member")) {
      if (!this.emailVerified()) {
        this.router.replace(`/?verifyemail=${this.userinfo.mail}`);
        return false;
      }

      if (!this.termsAccepted()) {
        const category = this.userinfo?.category?.trim().toLowerCase();

        const consentPages = {
          b2b: "/auth/consent/b2b",
          "b2b-minor": "/auth/consent/b2b",
          b2c: "/auth/consent/consumer",
          "b2c-minor": "/auth/consent/consumer",
          consumer: "/auth/consent/consumer",
          "consumer-minor": "/auth/consent/consumer",
        };

        this.router.replace(consentPages[category] || "/auth/consent/consumer");
        return false;
      }

      if (!(await this.hasCompletedWelcomeSurvey())) {
        this.router.replace("/survey?name=welcome");
        return false;
      }
    }
    return true;
  }
}
export function MemberProvider({ children }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [reload, setReload] = useState(1);
  const [me, setMe] = useState(null);
  // false until the first check of the member is done: a member page is not shown before that, so a first-time member never sees the
  // dashboard for a moment before being sent to the consent page. Later checks (Reload, another page) never hide a page.
  const [ready, setReady] = useState(false);
  // The page is prerendered (static export), so the server and the first browser render must be the same: both show the page. The gate
  // switches on right after hydration, before the browser paints (a layout effect), so the page is never seen and React finds no mismatch.
  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => setHydrated(true), []);
  const [categories, setCategories] = useState([]);
  const [router, pathname] = [useRouter(), usePathname()];
  function Reload() {
    setReload(reload + 1);
  }
  function update(data) {
    if (!Boolean(data)) updateMe(null);
    else updateMe(data);
  }
  async function Logout() {
    await api.delete("/api/v1/me");

    if (typeof window === "undefined") return;
    localStorage.clear();
    Reload();
    router.replace("/");
  }

  function updateMe(data) {
    setMe({
      ...data,
      Reload,
      Logout,
      update,
    });
  }

  useEffect(() => {
    api
      .get(`/api/v1/category/`)
      .then((resp) => {
        if (resp.status === "success") {
          setCategories(resp.data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load categories", err);
      });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadUserInfo()
      .then(async (resp) => {
        let user = new ValidUser(resp, router);

        const stay = await user.allowAccess(pathname);
        updateMe(resp);
        if (stay) setReady(true);
      })
      .catch((err) => {
        setMe(null);
        setReady(true); // not signed in: the page shows as before and handles it itself
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [reload, pathname]);
  useEffect(() => {
    if (isLoading) return () => {};

    api.get(`/api/v1/me/profile`).then((resp) => {
      update({
        ...me,
        ...resp.data,
      });
    });
  }, [isLoading]);

  const qualityScoreTotal =
    categories.find(
      (item) =>
        item?.name?.trim().toLowerCase() === me?.category?.trim().toLowerCase(),
    )?.qualityScoreScale ?? 0;

  const member = me
    ? {
        ...me,
        qualityScoreTotal,
      }
    : null;

  const waiting = hydrated && !ready && typeof pathname === "string" && pathname.startsWith("/member");
  return (
    <MemberContext.Provider value={member}>
      {waiting ? <LoadingOverlay /> : children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  return useContext(MemberContext);
}
