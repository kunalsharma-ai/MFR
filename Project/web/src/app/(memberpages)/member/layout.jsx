"use client";
import RewardSync from "./components/RewardSync";
import AdminSessionBanner from "./components/AdminSessionBanner";
import { useMember } from "@/Context";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";
import HubShell from "./hub/Shell.jsx";
import { PwaRegister } from "./hub/engage/pwa.jsx";

// Member hub redesign (Nov 2026): HubShell replaces MemberHeader + MemberSidebar + MemberFooter
// (those files stay in components/ untouched). The profile studio and survey pages render inside it unchanged.
function layout({ children }) {
  const user = useMember();
  if (!user) return <LoadingOverlay />;
  return (
    <>
      {user.adminSession ? <AdminSessionBanner session={user.adminSession} /> : null}
      <RewardSync />
      <PwaRegister />
      <HubShell>{children}</HubShell>
    </>
  );
}

export default layout;
