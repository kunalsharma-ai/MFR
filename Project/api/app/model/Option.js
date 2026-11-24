import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

export default mongooseModel(
    "Option",
    {
        question: {
            type: String
        },
        label: {
            type: String
        },
        value: {
            type: String
        },
        parentValue: [{
            type: String
        }],
        isSelected:{
            type:Boolean,
            default:false
        },
        isExclusive:{
            type:Boolean,
            default:false
        },
        // Super admin console: limit an option to some countries (ISO codes, lower case), e.g. income and currency bands
        countries: [{ type: String, lowercase: true, trim: true }],
        // Label per language other than English: { hi: "...", ... }
        translations: { type: mongoose.Schema.Types.Mixed, default: undefined },
        describeLabel:{
            type:String,
            default:""
        }
    },
    [
        [
            {
                question: 1,
                value: 1,
                origin: 1,
                label:1
            },
            {
                unique: 1
            }
        ]
    ]
)