import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

export default mongooseModel(
    "Category",
    {
        name: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        // Nov 2026, super admin console: signupOpen, countries, minAge, coreProfiles, theme. Unset = as before.
        settings: { type: mongoose.Schema.Types.Mixed, default: undefined },
        termsMessage:{
            type:String
        },
        terms:[
            {
                name:{
                    type:String,
                    required:true,
                    lowercase:true,
                    trim:true
                },
                body:{
                    type:String,
                    required:true
                },
                isRequired:{
                    type:Boolean,
                    required:true,
                    default:false
                }         
            }
        ]
    },
    [
        [
            {
                name: 1,
                origin: 1
            },
            {
                unique: true
            }
        ],
    ]
)