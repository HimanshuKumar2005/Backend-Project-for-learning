import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User }  from "../models/user.model.js"
import { jwt } from "jsonwebtoken"


export const verifyJWT = asyncHandler(async(req,_,next)=>{ //_ instead of res, bcz we are not using res in this func..
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ",""); //since we don't need bearer
    
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }

        req.user = user
        next(); //bcz of this next method will execute..
    } catch (error) {
        throw new ApiError(401,"Invalid Access Token")
    }

})