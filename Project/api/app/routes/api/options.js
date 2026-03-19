import express from "express";
import { User as userController } from "../../controller/index.js";
import { expressRoute, expressView, isAuthenticated, fsLogger } from "../../utils/index.js"
import fs from "fs";

const patterns = {
    orglocation: function (parent) {
        const temp = [
            "Employed part-time",
            "Self-employed full-time",
            "Self-employed part-time",
            "Temporary & Seasonal Employed",
            "Government/Public Employee",
            "Employed full-time"
        ]
        return temp.includes(parent)?{
            status:"success",
            data:[{pattern:"XltcIC16XSsk"}] 
        }:{
            status:"success",
            data:[{pattern:""}]
        }
    },
    orglinkedin: function (parent) {
        const temp = [
            "Employed part-time",
            "Self-employed full-time",
            "Self-employed part-time",
            "Temporary & Seasonal Employed",
            "Government/Public Employee",
            "Unemployed / Homemaker",
            "Unemployed",
            "Freelancer",
            "Employed full-time"
        ]
        return temp.includes(parent)?{
            status:"success",
            data:[{pattern:"Xmh0dHBzOi8vbGlua2VkaW4uY29tL2luL1thLXpBLVpdKyQ="}]
        }:{
            status:"success",
            data:[{pattern:""}]
        }
    },
    orgwebsite: function (parent) {
        const temp = [
            "Employed part-time",
            "Self-employed full-time",
            "Self-employed part-time",
            "Temporary & Seasonal Employed",
            "Government/Public Employee",
            "Employed full-time"
        ]
        return temp.includes(parent)?{
            status:"success",
            data:[{pattern:"XlthLXpBLVpcLlwtXDpdKyQ="}]
        }:{
            status:"success",
            data:[{pattern:""}]
        }
    },
}
const router = express.Router();
const world = JSON.parse(
    fs.readFileSync("/src/app/dataBank/theworld.json", "utf-8")
)
function getCN(country) {
    let cn
    if (country.length === 2)
        cn = world[country];
    else {
        cn = Object.values(world).find(c => c.name === country);
    }
    return cn;
}
router
    .post(
        "/zipcode",
        expressRoute(
            async req => {
                let country = req.body.country;
                let cn = getCN(country);
                return {
                    message: "",
                    data: [{
                        pattern: (Buffer.from(cn.zipFormat, "utf-8")).toString("base64")
                    }]
                }
            },
            userController
        )
    )
    .post(
        "/:question",
        expressRoute(
            async req => {
                if(!"empstat" in req.body )throw new Error("it works");
                if(req.params.question in patterns)
                return patterns[req.params.question](req.body.empstat)
            },
            userController
        )
    )
/*

    .get(
        "/country",
        expressRoute(
            async req => {
                return {
                    message: "", data: Object.values(world).map(cn => ({
                        label: cn.name,
                        value: cn.codes.iso2,
                        name: cn.codes.iso2
                    }))
                }
            },
            userController
        )
    )
    .post(
        "/state",
        expressRoute(
            async req => {
                let cn = getCN(req.body.country);
                if (!cn) return { message: "", data: [] }
                let data = Object.values(cn.states).map(st => ({
                    name: st.code,
                    label: st.name,
                    value: st.code
                }))
                return {
                    message: "",
                    data
                }
            },
            userController
        )
    )
 
    .post(
        "/city",
        expressRoute(
            async req => {
                let [cn, st] = req.body.parent.toUpperCase().split("-");

                let country = world[cn];
                let state = country?.states[st]
                let data = state?.cities?.map(ct => ({
                    name: ct,
                    label: ct,
                    value: ct
                }))
                return {
                    message: "",
                    data
                }
            },
            userController
        )
    )
    //*/
export default router;