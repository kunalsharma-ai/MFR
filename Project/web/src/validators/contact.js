import { api } from "@/util";
import { parsePhoneNumber } from "libphonenumber-js";

const email = {
  format: function (v) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
  },
  validateDomain: async function (v) {
    const email = v.split("@");
    if (email.length !== 2) return false;
    try {
      const temp = await api.post("/api/v1/validator/email", {   
        email: v,
      });
      return !!temp?.valid;
    } catch (e) {
      return false; 
    }
  },
};

const name = {
  pattern: /^[A-Za-z']+$/, 
  minLength: 2,
};

const phone = {
  isValid: function (val) {
    if(!val) return false;
    if(val.length < 4) return false;

    try{
      const parsedPhone = parsePhoneNumber("+" + val);
      return parsedPhone.isValid();
    }catch(e){
      return false;
    }
  }
}

const contact = {
  firstname: {
    required: "First Name is Required",
    minLength: {
      value: name.minLength,
      message: "Minimum 2 characters",
    },
    pattern: {
      value: name.pattern,
      message: "Invalid First Name",
    },
  },

  lastname: {
    required: "Last Name is Required",
    minLength: {
      value: name.minLength,
      message: "Minimum 2 characters",
    },
    pattern: {
      value: name.pattern,
      message: "Invalid Last Name",
    },
  },

  email: {
    required: "Email is Required",
    validate: async (v) => {
      if (!email.format(v)) return "Invalid Email";
      if (!(await email.validateDomain(v))) return "Email Address not valid";
      return true;
    },
  },

  message: {
    required: "Message cannot be blank",
    validate: (v) => v.trim().length > 0 || "Message cannot be blank",
  },

  // Phone validation depends on country — to be added later
  phone: {
    required: "Phone Number is Required",
    validate: (v) => phone.isValid(v) || "Invalid phone number"
  },
};

export default contact;