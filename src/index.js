//require('dotenv').config({path :'./env'}) //here . means home directory..

//now new method to import dotenv
import dotenv from "dotenv" // import feature is not given to the doucmentation but we can use through experimental feature...

import connectDB from "./db/index.js"  //it's important to write the file index.js... otherwise will give error..
import {app} from "./app.js"
dotenv.config({
    path : './env'
})

connectDB() //calling to connect the DB..
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port :${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed!!!",err);
    
})
/*
import express from "express"
const app = express()
;( async () =>{
    try{
        //connecting the DataBase..
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERR:",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    }catch(error){
        console.error("ERROR :",error);
        throw err
    }
})()
*/