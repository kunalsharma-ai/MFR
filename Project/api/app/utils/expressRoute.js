import { APIResponse } from "./index.js"
export default function expressRoute(callback, Controller) {
    return async (req, res) => {
        try {
            Controller.request = req;
            const { message, data, token, redirect } = await callback(req);
            if (redirect) return res.redirect(redirect)
            if (!token)
                return res.json(APIResponse.Success(message, data))
            res.cookie("authorization", `Bearer ${token}`, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax", // or "none" if cross-site
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.redirect(`/member/dashboard`)
        } catch (error) {
            console.log(error)
            // an error marked `expose` carries its own HTTP status, a machine-readable code and data (e.g. the About You
            // lock: 403, code "about_you", the profiles still open); every other error keeps the old 404
            const own = error?.expose === true;
            const status = own && Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : 404;
            const body = APIResponse.Error(error.message);
            if (own && typeof error.code === "string") body.code = error.code;
            if (own && error.data !== undefined) body.data = error.data;
            res.status(status).json(body)
        }
    }
}