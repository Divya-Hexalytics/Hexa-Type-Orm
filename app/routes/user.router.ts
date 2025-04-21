import { Router } from "express";

import UserController from "../controller/User.controller";
import verifyToken from "../middleware/verifyToken"; 

import multer from "multer";
import { storage, sizeLimit } from "../config/multer.config"; // Replace with your file path
// Configure multer for file upload
const upload = multer({
    storage: storage,
    limits: {
      fileSize: sizeLimit.fileSize,
    },
  });
//   const upload = multer({ storage: storage, fileFilter: fileFilter, limits: sizeLimit });


const router = Router();

router.post("/getUsers",UserController.getUsers)
router.post("/createUsers",UserController.createUser)
router.post("/update-password",verifyToken, UserController.updatePassword)

// const updateUserFiles = upload.fields([{ name: 'profile', maxCount: 1 }])
router.post("/update-user",verifyToken, upload.single("profile"), UserController.updateUser)


export default router;