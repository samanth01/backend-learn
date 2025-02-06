import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express()



app.use(cors({
    origin:process.env.CORS_ORIGIN,
     credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended:true}));


//routes
import userRouter from "./routes/user.routes.js"


//routes decleration
app.use("/api/v1/users", userRouter )


//http://localhost:8000/api/v1/users/register




export {app};