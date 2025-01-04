import { Router} from "express"
import { registerUser} from "../controllers/user.controller.js"

const router = Router()

router.route("/register").post(registerUser);

export default router //here default means we can import it as any other name ...