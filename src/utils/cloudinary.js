import {v2 as cloudinary} from "cloudinary"
import fs from "fs"  //file system , by default present in npm...


    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });

//Now making a method that will take the localpath as argument & upload it to the 
//cloudinary & provide the public link...
 
const uploadOnCloudinary = async (localPath)=>{
     try {
        if(!localPath) return null;

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localPath,{
            resource_type:"auto"
        })

        //file has been uploaded successfull
        console.log("file is uploaded on cloudinary",response.url);
        return response;
        
     } catch (error) {
        fs.unlinkSync(localPath);
        //remove the local saved temporary file as the upload operation got failed...
        return null;
     }
}

export {uploadOnCloudinary}