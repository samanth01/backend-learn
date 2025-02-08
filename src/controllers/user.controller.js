import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken'
import mongoose from "mongoose"



const generateRefreshTokenandAccessTokens = async(userId)=>{
 
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()


        user.refreshToken = refreshToken
        await user.save({validationBeforeSave:false})
        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, error.message || "Token generation failed")
        
    }
}
const registerUser = asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"le baba jiiii"
    // })



    // console.log("Files Received:", req.files);
    // console.log("Body Data:", req.body);

    // if (!req.files || !req.files.avatar) {
    //     throw new ApiError(400, "Avatar is required");
    // }



    //get user details from frontend
    //validation- not empty
    //check if user already exists: username, email
    //check for images, check for avtar
    //upload them to cloudinary, avtar
    //create user object - create entry in db
    //remove password and refresh token feild from response
    //check for user creation 
    //return response
    

    const {fullName, email, username, password } = req.body
    //console.log("email", email)


    if(
        [fullName, email, username, password].some((field)=>
    field?.trim() === "")
    ){

         throw new ApiError(400, "All fields are required")
    }


    const existedUser = await User.findOne({
        $or:[
             
            {username},
            {email}
        ]
    })

    if(existedUser){
        throw new ApiError(409, "User with this email or username already exists")
    }

    //console.log(req.files);

    //check for images, check for avtar

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;


    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
 








    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }


    //upload them to cloudinary, avtar

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar ){
        throw new ApiError(400, "Avatar upload required")
    }


    //create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "User creation failed")
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully"))
        
    });
    


const loginUser = asyncHandler(async(req,res)=>{

    //recieve req.body
    //get username email and password
    //get user by email or username
    // check password
    //generate access and refresh token
    //save refresh token in db
    //send access token and refresh token in response

    console.log(req.body);
    const {email, username,  password} = req.body

    console.log(email)
    if(!(username || email)){
        throw new ApiError(400, "Email or username is required")
    }





    const user = await User.findOne({
        $or:[
            {email},
            {username}
        ]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password")
    }
 
    const {accessToken, refreshToken}=await generateRefreshTokenandAccessTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

     

    const options = {
        httpOnly :true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)  
    .json(new ApiResponse(
        200,
         {
        user: loggedInUser, accessToken, refreshToken
         },
        "User logged in successfully"
      )
    )






})


const logOutUser = asyncHandler(async(req,res)=>{

    //make a middleware for authenticating if user has a access token and its valid
    //then find tht user and set the refresh token to undefined
    //clear the cookies and send response
    //return response




    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $unset:{
                refreshToken: 1 //this removes the field from document
            }
        }, {
            new:true

    })

    const options = {
        httpOnly :true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))









})



const refreshAccessToken = asyncHandler(async(req,res)=>{
    //get refresh token from cookie
    //verify refresh token
    //get user by id
    //generate new access token
    //send new access token in response
    //return response

     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

     if(!incomingRefreshToken){
         throw new ApiError(401, "Unauthorized request")
     }


     try {
        const decodedToken = jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
              )
   
   
   
        const  user  = await User.findById(decodedToken?._id)
   
        if(!user){
            throw new ApiError(404, "User not found || invalid refresh token")
   
           }
   
        if(incomingRefreshToken !== user?.refreshToken){
           throw new ApiError(401, "refresh token is expired or used")
        }
   
        const {newrefreshToken, accessToken} = await generateRefreshTokenandAccessTokens(user._id)
   
   
        const options = {
           httpOnly :true,
           secure:true
        }
   
   
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(new ApiResponse(200,
            {accessToken, resfreshToken:newrefreshToken},
             "Access token refreshed"))
   
     } catch (error) {
        throw new ApiError(401, error?.message||"Unauthorized request")
        
     }




        })


const changeCurrentPassword  = asyncHandler(async(req,res)=>{   
    const {oldPassword, newPassword} = req.body

    if(!oldPassword || !newPassword){
        throw new ApiError(400, "Current password and new password is required")
    }

    const user = await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid current password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req,res)=>{

    return res.status(200)
    .json(new ApiResponse(200, req.user, "User found"))
})

const updateAccoundDetails = asyncHandler(async(req,res)=>{
    const{fullName, email, username} = req.body

    if(!fullName || !email || !username){
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id, {
    
        $set:{
            fullName,
            email,
            username
        }
    
    
    
    },
                            {new:true}).select("-password  ")


    return res.status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})


const updateUserAvatar = asyncHandler(async(req,res)=>{
//get req.files from multer middleware
   const avatarLocalPath = req.files?.path

   if(!avatarLocalPath){
       throw new ApiError(400, "Avatar is required")
   }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set:{
            avatar: avatar.url
        }
    }, {new:true}).select("-password")




    return res.status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))










})


const updateUserCoverImage = asyncHandler(async(req,res)=>{
    //get req.files from multer middleware
       constcoverImageLocalPath = req.files?.path
    
       if(!coverImageLocalPath){
           throw new ApiError(400, "coverImage is required")
       }
    
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
        if(!coverImage.url){
            throw new ApiError(400, "error while uploading on coverImage")
        }
    
        const user = await User.findByIdAndUpdate(req.user?._id, {
            $set:{
                coverImage: coverImage.url
            }
        }, {new:true}).select("-password")



        return res.status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"))


    })

    
const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username){
        throw new ApiError(400, "Username is required")
    }

    // const user = await User.findOne({username}).select("-password")

    const channel = await User.aggregate([
    { 
            $match: { 
            username : username?.toLowerCase()
              } 
    },
    {
        $lookup:{
            from:"subscriptions",   //everything converts to lowercase and plural
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
        }
    },
    {
        $addFields:{
            subscriberCount:{
                $size: "$subscribers"
            },
            channelsSubscribedToCount:{
                $size: "$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        }
    },
    {
        $project:{
            fullName:1,
            username:1,
            subscriberCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1
        }
    }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exist")
    }


    return res.status(200).json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )


})
    

const getWatchHistory = asyncHandler(async (req, res)=>{

    const user = User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[{
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                               $project:{
                                fullName:1,
                                username:1,
                                avatar:1
                               } 
                            }
                        ]
                    }
                },{
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }
                   ]
            }
        }
    ])



    return res.status(200).json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )


})








export {registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccoundDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}