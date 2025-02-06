import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
});


cloudinary.config({
    cloud_name:"dzd5xnev5",
    api_key: 192965116484923,
    api_secret: "mCpyYVPkOwP9bwhd3ux5B229HYQ"
    

})


const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        //file has been uploaded successfully
        // console.log("file is uploaded on cloudinary",
        //     response.url
        // );
        fs.unlinkSync(localFilePath)
        return response;

        
    } catch (error) {

        fs.unlinkSync(localFilePath)  //remove the locally saved temporary file as the upload operation got failed
        return null;

        
    }
}

export   {uploadOnCloudinary};
