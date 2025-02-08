import { Router } from "express";
import { loginUser, registerUser, logOutUser, refreshAccessToken, changeCurrentPassword } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJwt } from "../middlewares/auth.middlewares.js";
const router = Router()



router.route("/register").post(
    upload.fields([
    {
        name:"avatar", 
        maxCount:1
    },
    {
        name: "coverImage",
        maxCount:1
    }
])
    

    
    
    ,registerUser)



router.route("/login").post(loginUser)





//secured routes
router.route("/logout").post(verifyJwt, logOutUser)

router.route("/refresh-token").post(refreshAccessToken)


 
router.route("/changepassword").post(changeCurrentPassword)












 




export default router;