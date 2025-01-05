import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser = asyncHandler( async (req,res)=>{
   /*//user registration steps
1.get user details from frontend
2.validation - not empty
3.check if user already exists : username , email
4.check for images, check for avatar
5.upload them to cloudinary, avatar
6.create user object - create entry in db
7.remove password and refresh token field from response
8.check for user creation
9.return response

->working on controller * */
    //data received from form & json
    const {fullName, email, username, password} = req.body
    console.log("email :",email);
    //console.log(req.body);
    //validation
  /*  if(fullName ===""){
       throw new ApiError(400,"fullName is required..");
    }*/

       //or
    if( [fullName, email, username, password].some((field) =>
    field?.trim()==="")){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exist..");
    }
   // express & multer adds some more to the req like req.body added by express & req.files added by multer

   const avatarLocalPath = req.files?.avatar[0]?.path //here ? means optional ..
   const coverImageLocalPath = req.files?.coverImage[0]?.path;

   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is required..");
   }

    //uploading to the cloudinary
   const avatar =  await uploadOnCloudinary(avatarLocalPath); // here await mean the control will stay here till the upload completion
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
    throw new ApiError(400, "Avatar file is required");
   }
  
   //making user object
   const user = await User.create({
    fullName,
    avatar : avatar.url,
    coverimage: coverImage?.url || "", //optional ? means
    email,
    password,
    username : username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user ") 

   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully.."
    )
   )

     
})

export {registerUser}