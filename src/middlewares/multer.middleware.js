import multer from "multer"





const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "C:\\Users\\Himanshu Kumar\\OneDrive\\Desktop\\Web D\\Backend codes Chai aur code\\Lec 6 How to setup a backend project\\public\\temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ storage, })