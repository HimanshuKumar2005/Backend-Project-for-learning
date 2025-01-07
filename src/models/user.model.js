import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jsonwebtoken from "jsonwebtoken"

const userSchema = new mongoose.Schema({
    username :{
       type: String,
       required : true,
       unique : true,
       lowercase : true,
       trime : true,
       index : true // just for searching
    },
    email :{
       type: String,
       required : true,
       unique : true,
       lowercase : true,
       trime : true,
      // index : true  more than 1 index is not prefered.
    },
    fullName : {
       type : String,
       required : true,
       trim : true,
       index : true
    },
    avatar :{
        type : String  //cloudinary url ()
    },
    coverimage : {
        type : String
    },
    watchHistory: [{
        type : mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    password : {
        type : String,
        required : [true,"Password is required"]
    },
    refreshToken : {
        type : String
    }

},{timestamps : true})


//Now encrypting using bcrypt
userSchema.pre("save",async function (next){
  if(!this.isModified("password")) return next();

  this.password = bcrypt.hash(this.password,10)
  next()
})

userSchema.methods.isPasswordCorrect = async function(password){ //inserting the methods..
    
 return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jsonwebtoken.sign(
        {
            _id:this._id,
            email: this.email,
            username : this.username,
            fullName : this.fullName
        },

        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jsonwebtoken.sign(
        {
            _id:this._id,
            email: this.email,
            username : this.username,
            fullName : this.fullName
        },

        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema);