import { Router } from "express";
import { loginUser, 
    registerUser,
     logOutUser,
      refreshAccessToken, 
      changeCurrentPassword,
     } from "../controllers/user.controller.js";
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


 
router.route("/change-password").post(verifyJwt,changeCurrentPassword)

router.route("/current-user").get(verifyJwt, getCurrentUser)

router.route("/update-account").patch(verifyJwt, updateAccoundDetails)


router.route("/avatar").patch(verifyJwt,
    upload.single("avatar"),
    updateUserAvatar
)


router.route("/coverImage").patch(verifyJwt, 
    upload.single("coverImage"),
    updateUserCoverImage
)


//while using params to fetch data from client req we do this
router.route.("/c/:username").get(verifyJwt,
    getUserChannelProfile
)




router.route("/history").get(verifyJwt, getWatchHistory)







 




export default router;