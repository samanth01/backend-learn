 
import connectDB from "./db/db.js";
import dotenv from 'dotenv';


dotenv.config({
    path:'./env'
})




connectDB();

// const app = express()
// ( async()=>{

//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//         app.on('error', (error)=>{
//             console.log('not able to connect', error);
//             throw error
//         });
//         app.listen(process.env.PORT,()=>{
//             console.log('app listening on port ', process.env.PORT);
//         });
        
//     } catch (error) {
//         console.error("ERROR: ", error);
//         throw err
        
//     }
// })()


