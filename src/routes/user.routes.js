import { Router} from "express"
import { registerUser} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";

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

export default router //here default means we can import it as any other name ...