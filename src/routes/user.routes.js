import { Router} from "express"
import { loginUser, logoutUser, refreshAccessToken, registerUser} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",  //name should be same in backend & frontend..
            maxCount:1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ])
    ,registerUser);//used multer just before registration


router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

export default router //here default means we can import it as any other name ...