"use client";

import { useEffect } from "react";
import { useMember } from "@/Context";
import { syncSurveyRewards } from "@/hooks/useProfileGate";

export default function RewardSync() {
  const user = useMember();
  useEffect(() => {
    if (user?._id) syncSurveyRewards(user);
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
