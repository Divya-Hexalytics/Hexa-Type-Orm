import { Router } from "express";

import AuthController from "../controller/Auth.controller";

const router = Router();

router.post("/register-user",AuthController.RegisterUser)
router.post("/login-user",AuthController.LoginUser)

export default router;