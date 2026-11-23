"use client";
import RewardSync from "./components/RewardSync";
import { useMember } from "@/Context";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";
import HubShell from "./hub/Shell.jsx";

// Member hub redesign (Nov 2026): HubShell replaces MemberHeader + MemberSidebar + MemberFooter
// (those files stay in components/ untouched). The profile studio and survey pages render inside it unchanged.
function layout({ children }) {
  const user = useMember();
  if (!user) return <LoadingOverlay />;
  return (
    <>
      <RewardSync />
      <HubShell>{children}</HubShell>
    </>
  );
}

export default layout;
