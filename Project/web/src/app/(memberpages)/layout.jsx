import React from "react";
import { ContextProviders } from "@/Context";
import MemberLanguage from "@/i18n/MemberLanguage"; // the language chosen on the public site
export default function layout({ children }) {
    return (<ContextProviders><MemberLanguage />{ children }</ContextProviders>)
}