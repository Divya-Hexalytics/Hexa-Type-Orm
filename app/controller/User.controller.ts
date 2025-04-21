import { NextFunction, Request, Response } from "express";
import ErrorResponse from "../utils/ErrorResponse";
import SuccessResponse from "../utils/SuccessResponse";
import { getDataSource } from "../database/index";
import { User } from "../database/model/User.model";
import { DataSource, EntityManager } from "typeorm";
import Util from "../utils/Util";
import {uploadFileToS3, deleteFileFromBucket} from "../utils/S3Storage";

interface UserDataToBeUpdated{
    first_name:string, 
    last_name:string,
    updated_by:number,
    profile?: string
}
  

const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const dataSource = await getDataSource();
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        const manager: EntityManager = dataSource.manager;
        const users = await manager.find(User);

        res.send(new SuccessResponse(200, "User fetched successfully", users))
    } catch (error) {
        next(error);
    }
};

const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const dataSource = await getDataSource();
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        const manager: EntityManager = dataSource.manager;
        console.log(`headers: ${req.headers}`);
        console.log(`body: ${req.body}`);
        
        const userDetails = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: req.body.password,
            is_active: req.body.is_active,
            created_by: 0
        }
        // res.send(userDetails);
        const user = manager.create(User, userDetails);
        console.log(`user: ${user}`);

        const results = await dataSource.manager.save(user);
        console.log(`user: ${results}`);

        res.status(201).json(results);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Error creating user" });
    }
};

const updatePassword = async(req: Request, res: Response, next: NextFunction) => {
    try {
        // required validation
        let requiredValidationError = Util.validate_prams(
            req.body,
            {
                password: "ANY"
            },{
                password: "Password"
            }
        );
        if(Object.values(requiredValidationError).length){
            const myErrorMessage = Object.values(requiredValidationError).length ? Object.values(requiredValidationError) : ["Validation Error"];
            throw new Error(...myErrorMessage);
        }

        let dataSource = await getDataSource();
        if(!dataSource.initialize){
            await dataSource.initialize();
        }

        // update password
        if(!req.user){
            throw new Error("Unauthorized Access");
        }

        const user_id = req.user.uid;
        const user_email = req.user.email;

        const encryptedPassword = await User.getEncryptedPassword(req.body.password);
        console.log("encryptedPassword:",encryptedPassword);
        const updatedUser = await dataSource
            .createQueryBuilder()
            .update(User)
            .set({password:encryptedPassword})
            .where({id:user_id})
            .execute();

        // send response
        if (updatedUser.affected && updatedUser.affected > 0) {
            let success_data  = { userId: user_id, email:user_email };
            console.log(success_data);
            res.status(200).send(new SuccessResponse(200, "Password Updated successfully", success_data));
        } else {
            throw new Error("Password update failed")
        }
        

    } catch (error) {
        next(error);
    }
}

const updateUser = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if(req.body.email){
            throw new Error("Cannot update email Id");
        }

        // required validation
        let requiredValidationError = Util.validate_prams(
            req.body,{
                first_name:"ANY",    
                last_name:"ANY"    
            },{
                first_name:"First Name",    
                last_name:"Last Name"
            }
        )
        
        let dataSource = await getDataSource()
        if(!dataSource.isInitialized){
            await dataSource.initialize();
        }

        // check user exist
        if(!req.user){
            throw new Error("Unauthorized access");
        }
        
        // update user
        let user_id = req.user.uid;
        let userDataToBeUpdated: UserDataToBeUpdated = {first_name:req.body.first_name, last_name:req.body.last_name, updated_by:0}
        /////////////////////
        const file = req.file;
        if (file) {
            // const dynamicPath = `${process.env.UPLOAD_DIRECTORY}/${user_id}`;
            const dynamicPath = `profile`;
            // const dynamicPath = ``;
            let userCurrentDetails = await dataSource
                .createQueryBuilder()
                .select(["user.profile"])
                .from(User,"user")
                .where("user.id = :id", { id: user_id })
                .getOne();
        
            if(userCurrentDetails){
                let userCurrentProfile = userCurrentDetails.profile;
                await deleteFileFromBucket(`${dynamicPath}/${userCurrentProfile}`);
            }
            else{
                throw new Error("User not found")
            }
                
            
            let fileName = `${file.originalname}`;
            const fileBuffer = file.buffer;
            const fileUrl = await uploadFileToS3(
                fileBuffer,
                dynamicPath,
                fileName
            );
            
            let fileUrlArr = fileUrl.key.split("/");
            let myfileName = fileUrlArr[fileUrlArr.length-1];
            userDataToBeUpdated.profile = myfileName;
        }

       
        let updateResult = await dataSource.createQueryBuilder()
            .update(User)
            .set(userDataToBeUpdated)
            .where({id:user_id})
            .execute();

        if(updateResult.affected && updateResult.affected>0){
            let updatedUserDetails = await dataSource
            .createQueryBuilder()
            .select(["user.id","user.first_name","user.last_name",
                "user.profile","user.is_active","user.created_at","user.updated_at"])
            .from(User,"user")
            .where("user.id = :id", { id: user_id })
            .getOne();
            
           
            // send response
            if(updatedUserDetails){
                res.status(200).send(new SuccessResponse(200,"User updated successfully",updatedUserDetails))
            }
            else{
                throw new Error("User not found")
            }
        }
        else{
            throw new Error("User update failed")
        }
        
        
        

    } catch (error) {
        next(error);
    }
}

const deleteUser = async(req: Request, res: Response, next: NextFunction) => {
    try {
        let requiredValidationError = Util.validate_prams(
            req.body,{
                first_name:"ANY",    
                last_name:"ANY"    
            },{
                first_name:"First Name",    
                last_name:"Last Name"
            }
        )
        
        let dataSource = await getDataSource()
        if(!dataSource.isInitialized){
            await dataSource.initialize();
        }
        // check user exist
        if(!req.user){
            throw new Error("Unauthorized access");
        }
        
        let user_id = req.user.uid;
        // delete user
        let deleteResult = await dataSource.createQueryBuilder()
        .delete()
        .from(User)
        .where({id:user_id})
        .execute();

        // if(deleteResult.affected && deleteResult.affected>0){
        let userDetails = await dataSource.createQueryBuilder()
        .select("*")
        .from(User,"user")
        .where({id:user_id})
        .getOne();
        if(!userDetails){
            return res.status(200).send({})
        } 
        // }
        // send response
        
        

    } catch (error) {
        next(error);
    }
}

export default {
    createUser,
    getUsers,
    updatePassword,
    updateUser,
    deleteUser
};