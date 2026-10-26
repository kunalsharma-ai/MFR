"use client";
import MemberHeader from "./components/MemberHeader";
import MemberSidebar from "./components/MemberSidebar";
import MemberFooter from "./components/MemberFooter";
import RewardSync from "./components/RewardSync";
import FeedbackForm from "@/componentsMHO/FeedbackForm";
import { Popup } from "@/components/Popup";
import { useMember } from "@/Context";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";

function layout({ children }) {
  const user = useMember();
  if (!user) return <LoadingOverlay />;
  return (
    <div>
      <RewardSync />
      <MemberHeader />
      <MemberSidebar>
        <main>{children}</main>
      </MemberSidebar>
      <MemberFooter />
      {/* <Popup open={true} onClose={() => {}} hideTitle maxWidth="sm">
          <FeedbackForm />
        </Popup> */}
    </div>
  );
}

export default layout;
