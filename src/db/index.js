//thumb rule DB is in another continent..
import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"


const connectDB = async () =>{
    try{ //we are using await here since DB is in another continent..
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error){
        console.log("MONGODB connection error :",error);
        process.exit(1);
    }
}  

export default connectDB