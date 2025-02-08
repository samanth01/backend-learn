import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public\\temp\\filleeeee")
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname)
    }
  })


  
  export  const upload = multer(
    { 
      storage
      
    }
  )
  
  // const storage = multer.diskStorage({ destination: "public/temp/filleeeee",
  //   filename: (req, file, cb) => { cb(null, Date.now() + "-" + file.originalname); }, });



// import fs from "fs";

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         const uploadPath = "public\\temp\\filleeeee";
//         if (!fs.existsSync(uploadPath)) {
//             fs.mkdirSync(uploadPath, { recursive: true });
//         }
//         cb(null, uploadPath);
//     },
//     filename: function (req, file, cb) {
//         cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
//     }
// });


// export  const upload = multer(
//     { 
//         storage
        
//      }
// )
