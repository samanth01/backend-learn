import {asyncHandler} from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/user.models.js"
// import dotenv from "dotenv"

//  dotenv.config({
//      path:'./.env'
//  })
 
 
 

export const verifyJwt = asyncHandler(async(req,_,next)=>{

   try {
     const token = req.cookies?.accessToken || 
                  req.header("Authorization")?.replace("Bearer ","")
 
 
      console.log(token)
 
     if(!token){
        throw new ApiError(401, "Unauthorized")
     }
 
     const decodedToken = jwt.verify(token,  "4njkn443nj")
 
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if(!user){
         throw new ApiError(401, "invalid access token")
     }
 
     req.user = user;
     next()
   } catch (error) {
         throw new ApiError(401, error?.message||"Unauthorized")
    

   }
})