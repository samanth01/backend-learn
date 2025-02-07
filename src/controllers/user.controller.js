import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken'



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
            $set:{
                refreshToken: undefined
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






export {registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken
}