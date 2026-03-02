"use client"
import React from "react";
import Select from "./Select";
import { useForm } from "react-hook-form";

export default function page() {
  const form = useForm();
  return (<div className="page-content">
    <div className="padding-20">
      <Select
        control={ form.control }
        { ...form.register("test") }
        errors={ form?.formState?.errors?.test }
        options={ [
          "a", "b", "c", "d"
        ].map(elm => ({
          value: elm,
          label: elm
        })) }
        label="Test Input"
        multiple
        hasOthers={true}
        hasSkip={true}
        hasNone={true}
      />
    </div>
  </div>)
}