import { Request, Response, NextFunction } from "express"
import SuccessResponse from "../utils/SuccessResponse";
import { getDataSource } from "../database/index";
import { User } from "../database/model/User.model";
import { EntityManager } from "typeorm";
import Util from "../utils/Util";
import ErrorResponse from "../utils/ErrorResponse";
import { isEmpty } from "validator";
import { isObject } from "node:util";


class ValidationError extends Error {
    errors: any; // Or a more specific type
  
    constructor(message: string, errors: any) {
      super(message);
      this.name = "ValidationError";
      this.errors = errors;
    }
  }

const LoginUser = async function(req: Request, res: Response, next: NextFunction): Promise<void>{
    interface UserDetails {
        id?: number;
        email: string;
        firstName: string;
        lastName: string;
        token?: string;
        refreshToken?: string;
    }

    
    try {
        let requiredValidationError = Util.validate_prams(
            req.body,{
                'email': 'EMAIL',
                'password': 'ANY'
            },
            {
                'email': 'Email',
                'password': 'Password'
            }
        );

        if(Object.values(requiredValidationError).length){;
            const myErrorMessage = Object.values(requiredValidationError).length ? Object.values(requiredValidationError) : ["Validation Error"];
            throw new Error(...myErrorMessage);
        }
        const dataSource = await getDataSource();
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        
        // Get user by email
        let userData = await User.getUserByEmail(req.body.email);
        if(!userData){
            throw new Error("User email not registered");
        }

        // compare password
        let isCorrectPassword = await User.comparePassword(req.body.password,userData?.password);
        console.log("isCorrectPassword: ",isCorrectPassword);
        
        if(!isCorrectPassword){
            throw new Error("Incorrect Password")
        }

        let userDetails: UserDetails = {
            id: userData.id,
            email:req.body.email,
            firstName: userData.first_name,
            lastName: userData.last_name
        }
        // generate Token and refresh token
        let token = await User.generateToken(userDetails)
        let refreshToken = await User.generateRefreshToken(userDetails);


        // send response
        delete userDetails.id;
        userDetails.token = token;
        userDetails.refreshToken = refreshToken;
        res.send(new SuccessResponse(200,"Login successful", userDetails))
        return;
        
    } catch (error) {
        next(error);
    }
    
}

const RegisterUser = async function(req: Request, res: Response, next: NextFunction){
    try {
        let requiredValidationError = Util.validate_prams(req.body,{
            first_name: 'A' , 
            last_name: 'A',  
            email: 'EMAIL',  
            password: 'ANY'  
        },{
            first_name: 'First Name',  
            last_name: 'Last Name',  
            email: 'Email',
            password: 'Password'
        })
        console.log("ValidationError:" , requiredValidationError);
        if(Object.values(requiredValidationError).length){
            const myErrorMessage = Object.values(requiredValidationError).length ? Object.values(requiredValidationError) : ["Validation Error"];
            throw new Error(...myErrorMessage);
        }

        
        const dataSource = await getDataSource();
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        const manager: EntityManager = dataSource.manager;
        
        // check if user already exist
        let userData = await User.getUserByEmail(req.body.email);
        if(userData){
            throw new Error("User email already exist")
        }

        const encryptedPassword = await User.getEncryptedPassword(req.body.password);

        const userDetails = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: encryptedPassword,
            is_active: true,
            created_by: 0
        }
        const savedUser = manager.create(User, userDetails);
        const resultUser = await dataSource.manager.save(savedUser);
        
        res.status(201).send(new SuccessResponse(201,"User created successfully", resultUser))

    } catch (error: any) {
        console.error(
            "Error Response:",
            error.code,
            error.message,
            error.error,
            error.stack,
            error.name,
            error.success,
          );
        next(new ErrorResponse(500, error.message,error, error.stack))
    }
}

export default {LoginUser, RegisterUser}