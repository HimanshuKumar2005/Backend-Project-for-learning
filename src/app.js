import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
const app = express()



app.use(cors({  //here use() is used for middlewares..
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit: "16kb"}))  //just setting the limit of accepting json data..
app.use(express.urlencoded({ extended : true,limit : "16kb"})) //just to get the data from url , extend means it will receive the data of more complex type..

app.use(express.static("public"))  //used to store the users pdf files..
export {app}