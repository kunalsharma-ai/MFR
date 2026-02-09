"use client"
import { useToast } from "@/hooks";
import HomeClient from "./homeclient";

export default function HomePage() {
  useToast({status:"success",message:"it works"});
  return <HomeClient />;
}
