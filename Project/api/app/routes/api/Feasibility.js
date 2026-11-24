import express from "express";
import { User as userController, Answer as answerController } from "../../controller/index.js";
import { expressRoute, expressView, isAuthenticated, fsLogger, getMailer, sendMail, Token } from "../../utils/index.js"
import { requireAdmin } from "../../utils/access.js";
import { limit } from "../../utils/security.js";

const router = express.Router();
router
    .route('/')
    // how many members the brand has: admins only (it was public)
    .get(requireAdmin, expressRoute(
        async req => {
            // Read all entries
            let message = "";
            let data = await userController.list()
            return { message, data:data.length };
        },
        userController
    ))
    .post(limit(60, 10), expressRoute(
        async req => {
            // Read all entries matching filter
            let message = "";
            // question names map to lists of answers; nothing else (no "$or" or other operators from the browser)
            const body = Object.fromEntries(Object.entries(req.body && typeof req.body === "object" ? req.body : {})
                .filter(([k, v]) => !k.startsWith("$") && v && typeof v === "object"));
            let filters=Object.fromEntries(Object.entries(body).map(fltr=>{
                if(fltr[1] instanceof Array)return fltr;
                if(fltr[0]==="Country"){
                    return ["country",Object.keys(fltr[1])]
                }
                return [fltr[0],Object.keys(fltr[1])]
            }))
            if("Age" in filters){
                let temp=filters.Age.map(age=>{
                    let start=new Date("0000-01-01")
                    let end=new Date("0000-12-31")
                    let today=new Date();
                    end.setFullYear(today.getFullYear() - age.min )
                    start.setFullYear(today.getFullYear() - age.max )
                    return {dob:{
                        $gt:start,
                        $lt:end
                    }}
                })
                delete(filters.Age);
                filters["$or"]=temp;
            }
            let data = await answerController.feasibility(filters)
            return { message, data:data.length };
        },
        answerController
    ))

export default router;