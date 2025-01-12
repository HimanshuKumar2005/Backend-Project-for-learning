import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

//make the schema
const commentSchema = new mongoose.Schema({
    content : {
        type:String
    },
    video : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps : true})

commentSchema.plugin(mongooseAggregatePaginate)  // this is just for paginate that will load the some more pages when user scrolls..

//Export
export const Comment = mongoose.model("Comment",commentSchema);