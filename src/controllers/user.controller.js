import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

import jwt from "jsonwebtoken"
import mongoose  from "mongoose"
import { uptime } from "process"

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
    username : username
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

   if(!username && !email){
      throw new ApiError(400,"username or email is required");
   }

   //Now finding the username or email from the database using findOne() ,method from MongoDB
   const user =  await User.findOne({  //or : mongoDB operator
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

//Lec : 16 :Access & refresh token
const refreshAccessToken = asyncHandler(async(req,res) =>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;//(from cookies || from body)

   if(incomingRefreshToken){
      throw new ApiError(401,"Unauthorized request");
   }

  try {
    const decodedToken = jwt.verify(
       incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
    )
 
    const user = await User.findById(decodedToken?._id)
 
    //check
    if(!user){
       throw new ApiError(401,"Invalid refresh Token")
    }
 
    if(incomingRefreshToken !== user?.refreshToken){
       throw new ApiError(401,"Refresh token is expired or used")
    }
 
    const options = {
       httpOnly:true,
       secure : true
    }
 
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
 
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
       new ApiResponse(
          200,
          {accessToken,refreshToken},
          "Access token refreshed"
       )
    )
  } catch (error) {
     throw new ApiError(401,error?.message || "Invalid refresh token");
  }


})

//Lec : 17
const changeCurrentPassword = asyncHandler(async(req,res) =>{
   const {oldPassword,newPassword,confirmPassword} = req.body;  //adding a new parameter as confirmPassword

   if(!(confirmPassword===newPassword)) throw new ApiError(400,"confirm password mismatched..")

   //since user has the password change option , then he must be logged in ,so it
   const user =  await User.findById(req.user?._id)

   //just checking the oldPassword
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect) throw new ApiError(400,"Invalid password..")

   user.password = newPassword;
   //now just save ,before which a pre - hook is called
   await user.save({validateBeforeSave : false}) //since we db is in another continent
   
   return res.status(200).json(new ApiResponse(200,{},"Password changed Successfully"))
    
})

//Lec : 17
const getCurrentUser = asyncHandler(async(req,res)=>{
   return res.status(200).json(200,req.user,"current user fetched successfully"); //since user field is inserted by middleware..
})

//Lec : 17
const updateAccountDetails = asyncHandler(async(req,res)=>{
   const {fullName,email} = req.body

   if(fullName && email) throw new ApiError(400,"All fields are required")
      
   const user = User.findByIdAndUpdate(
      req.user?._id,
      {
         $set :{ //just updating the fields
            fullName : fullName,
            email  //since both are same..
         }
      },
      {new : true} //here true indicate that it will return the updated data of user
   ).select("-password"); //just remove the password..


   return req.status(200)
   .json(new ApiResponse(200,user,"Account details updated successfully"))
})

//Lec : 17 - updating the files..

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path; //

    if(!avatarLocalPath) throw new ApiError(400,"Avatar file is missing..")
   
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) throw new ApiError(400,"Error while uploading on avatar");

    //now updating the link : my approach
   /* const user = await User.findById(req.user?._id); //since user is inserted in req by middleware

    user.avatar = avatar.url;
    await user.save()*/

    //sir's approach
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar : avatar.url
         }
      },
      {new : true}
   ).select("-password");

   return res.status(200).json(200,user,"Avatar updated successfully..")


})

//Lec : 17 : updating the coverImage
const updateCoverImage = asyncHandler(async(req,res)=>{
   const coverImageLocalPath = req.file?.path;

   if(!coverImageLocalPath) throw new ApiError(400,"CoverImage not found in temp")

   //upload on cloudinary
   const coverImage = uploadOnCloudinary(coverImageLocalPath);
   if(!coverImageLocalPath) throw new ApiError(400,"Error in uploading coverImage on cloudinary")

   //fetching user & updaing
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set : {
            coverImage : coverImage.url
         }
      },
      {new : true}
   ).select("-password")

   return res.status(200).json(200,user,"CoverImage updated successfully..")


})

//Lec : 18 : 
const getUserChannelProfile = asyncHandler(async(req,res)=>{
   const {username} = req.params; // profile getting by url not body

   if(!username?.trim()){
      throw new ApiError(400,"username is missing in geting channel profile")
   }

   // User.find({username})
   //Now using aggregation pipeline
   const channel = await User.aggregate([
      {
         $mathch:{
            username : username?.toLowerCase()
         }
      },
      {   //to calulate the subscribers..
         $lookup :{
            from : "subscriptions", // since going into data base model name become lower & plural
            localField: "_id",
            foreignField :"channel",
            as : "subscribers"
         }

      },
      {  //just calculating the subcribed to some channel by the user
         $lookup : {
            from : "subscriptions",
            localField: "_id",
            foreignField :"subscriber",
            as : "subscribedTo"
         }
      },
      {
         $addFields :{
            subscribersCount :{
               $size:"$subscribers"
            },
            channelsSubscribedToCount : {
               $size : "$subscribedTo" //here we are using $ sign bcz subscribedTo is a field..
            },
            isSubscribed : {
               $cond :{ //it has 3 field if : then: , else:

                  if: { $in : [req.user?._id,"$subscribers.subscriber"]},
                  then: true,
                  else : false

               }
            }
         }
      },
      {
         $project :{  //here we are not sending all value , just make true the field whatever you want to send..
            fullName : 1,
            username :1,
            subscribersCount : 1,
            channelsSubscribedToCount : 1,
            isSubscribed :1,
            avatar : 1,
            coverImage : 1,
            email : 1
         }
      }
   ])

   if(!channel?.length) throw new ApiError(400,"Channel does not exist");

   return res
   .status(200)
   .json(
      new ApiResponse(200,channel[0],"User channel fetched successfully")
   )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
   //this function will get the watch history of the user..
   //const userId = req.user?._id; /**
   // this will give the user id , like 'utiweu3875325u' string , but the actual user id of the type , ObjectId('753kfsadhgkj') , but 
   // req.user?._id is converted to the actual format of id by mongoose.. */

   const user = User.aggregate([
      {
         $match :{
            _id : new mongoose.Types.ObjectId(req.user._id)
         }
      },//after this stage we got the a single document of user
      //NOw it's time to lookup with the videos..
      {
         $lookup:{
            from :"videos", //plural & lower (name of collection of db)
            localField :"getWatchHistory",
            foreignField :"_id",
            as : "watchHistory",
            pipeline : [
               {    //currently in video model , and mapping it with user or its owner
                  $lookup:{
                     from : "users",
                     localField : "owner",
                     foreignField : "_id",
                     as : "owner",
                     pipeline : [  //this can be made as the next stage 
                        {
                           $project : {
                              fullName : 1,
                              username : 1,
                              avatar : 1,
                              coverImage : 1
                           }
                        }
                     ]
                  }
                  //project can be written over here just to filter the fields of the owner..
               },
               {
                  $addFields : {
                     owner : {  // just overriding the fields
                        $first : "$owner"
                     }
                  }
               }
            ] 
             
         }
      }

   ])

   return res.status(200).json(new ApiResponse(200,user[0].wathHistory,"Watch history fetched successfully.."));
})

export {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateCoverImage,
        getUserChannelProfile,
        getWatchHistory
}