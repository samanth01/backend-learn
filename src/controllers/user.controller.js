import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"le baba jiiii"
    // })




    //get user details from frontend
    //validation- not empty
    //check if user already exists: username, email
    //check for images, check for avtar
    //upload them to cloudinary, avtar
    //create user object - create entry in db
    //remove password and refresh token feild from response
    //check for user creation 
    //return response
    

    const {fullName, email, password, username } = req.body



    if([fullName, email, password, username].some((field)=>
    field?.trim() === "")){

         throw new ApiError(400, "All fields are required")
    }


    const existedUser = User.findOne({
        $or:[
            {email},
            {username}
        ]
    })

    if(existedUser){
        throw new ApiError(409, "User with this email or username already exists")
    }

    //check for images, check for avtar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const converImageLocalPath = req.files?.coverImage[0]?.path;


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }


    //upload them to cloudinary, avtar

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(converImageLocalPath)

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
        new ApiResponse(201, createdUser, "User created successfully"))

})


export {registerUser}