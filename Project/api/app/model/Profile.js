import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

export default mongooseModel(
    "Profile",
    {
        name: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        icon: {
            type: String,
        },
        pages:[],
        // Super admin console: points paid when the profile is completed (null = the default, 50) and the time it takes
        points: { type: Number, default: null, min: 0 },
        estimatedMinutes: { type: Number, default: null, min: 1 },
        category: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
    },
    [
        [
            {
                name: 1,
                category: 1,
                origin: 1
            },
            {
                unique: true
            }
        ],
        [
            {
                slug: 1,
                category: 1,
                origin: 1
            },
            {
                unique: true
            }
        ]
    ],

)