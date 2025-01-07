import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

import jwt from "jsonwebtoken"
import mongoose  from "mongoose"

const generateAccessAndRefreshToken = async(userId) =>{

   try{
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      //Now store the refreshToken in the DB
      user.refreshToken = refreshToken;
      //saving to the DB
      await user.save({ validateBeforeSave :false})
       
      return {accessToken, refreshToken}; 

   }
   catch(error){
      throw new ApiError(500,"Something went wrong while generating refresh and access Token");
   }
}

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

    const existedUser = await User.findOne({
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
    coverImage: coverImage?.url || "", //optional ? means
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

//Lec : 15
const loginUser = asyncHandler( async (req,res) =>{
   //writing the steps by myself
   /**
    * 1.take username or email or number.. and also the password..
    * 2.Check this username or email or number exists as a user or not
    * if not then throw an error
    * 3.if exists then match the password 
    * if not matched then throw error
    * if matched then logged in successfully..
    * 4.Access & refresh token.. generation..
    * 5.Send cookies
    */
   const {email, username, password} = req.body;  //taken data from database

   if(!username || !email){
      throw new ApiError(400,"username or email is required");
   }

   //Now finding the username or email from the database using findOne() ,method from MongoDB
   const user =  await User.findOne({  //$or : mongoDB operator
      $or: [{username},{email}]  //used await bcz DB is in another continent
   })

   if(!user){
      throw new ApiError(404,"User not found");
   }

   //checking password..
   const isPasswordCorrect = await user.isPasswordCorrect(password);

   if(!isPasswordCorrect){
      throw new ApiError(401,"Invalid User credential..");
   }
   //generating accessToken & refreshToken..
   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id); //time lag sakta h issiliye await lagaya

   const loggedInUser = await User.findById(user._id).select(" -password -refreshToken");

    //cookies
    const options ={ //by default cookie is modifiable through frontend but by making 
      //true the following field we make it only modifiable through servers..
      httpOnly : true,
      secure : true
    }
    //200 mean ,sara kaam achhe se ho gya h..
   return res.status(200).cookie("accesToken",accessToken,options) //adding cookies..
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(  //sending response
         200,
         {
            user : loggedInUser, accessToken,
            refreshToken 
         },

         "User logged in successfully"
      )
   )




})

//Lec : 15 logout
const logoutUser = asyncHandler( async(req,res)=>{
     await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            refreshToken:undefined
         }
      },
      {
         new : true //this will retain the new values..
      }
     )

     const options ={ //by default cookie is modifiable through frontend but by making 
      //true the following field we make it only modifiable through servers..
      httpOnly : true,
      secure : true
    }
    
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))


})

export {registerUser,
        loginUser,
        logoutUser
}