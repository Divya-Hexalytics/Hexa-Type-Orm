import { Request, Response, NextFunction } from "express";
import { User } from "../database/model/User.model";
import ErrorResponse from "../utils/ErrorResponse";

// Extend the Request interface

const verifyToken = async(req: Request, res: Response, next:NextFunction)=>{
    try {
        let authToken = req.headers['authorization'];
        if(!authToken){
            throw new Error("Token not found")
        }
        
        let parseToken = authToken.split(" ");
        let token = parseToken[1];
        if(!token){
            throw new Error("Invalid token")
        }
        
        let tokenData = User.verifyToken(token);
        if(!Object.keys(tokenData).length){
            throw new Error("Unauthorize access")
        }
        if(typeof tokenData !== 'string' && tokenData.id){
            
            req.user = {
                uid: tokenData.id,
                email: tokenData.email,
                firstname: tokenData.email,
                lastname: tokenData.role
            };
        }
        // next();
    } catch (error: any) {
        let response = "Token issue";
        if (error.name === "JsonWebTokenError") {
            response = "Token is invalid";
        }
        if (error.name === "TokenExpiredError") {
            response = "Session Expired!";
        }
        // error.name = error.message; 
        error.message = response
        next(error);
    }
    next();
}

export default verifyToken;