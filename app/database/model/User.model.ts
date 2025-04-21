import { Entity, EntityManager, PrimaryGeneratedColumn, Column, Timestamp, DataSource, UpdateDateColumn } from "typeorm"
import { getDataSource } from "../../database/index";
import bcrypt from "bcrypt"
import jwt, { JwtPayload } from "jsonwebtoken"
import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    first_name!: string

    @Column()
    last_name!: string

    @Column()
    email!: string

    @Column()
    password!: string

    @Column({nullable: true})
    profile?: string

    @Column()
    is_active!: boolean
    
    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" }) // Explicit type and default
    created_at!: Date
    
    @Column()
    created_by!: number
    
    // @Column({ type: "timestamp", nullable: true, default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }) // Explicit type and nullable
    // @Column({ type: "timestamp", nullable: true, default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }) // Explicit type and nullable
    // updated_at!: Date
    @UpdateDateColumn({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;
 
    @Column({nullable: true})
    updated_by!: number

    static async checkUserExist(email: string): Promise<boolean> {
        const dataSource: DataSource = await getDataSource(); // Await getDataSource
        const userRepository = dataSource.getRepository(User);
        const myUserData = await userRepository 
            .createQueryBuilder("user")
            .where("user.email = :email", { email })
            .getOne();

        if(myUserData){
            return true;
        }
        else{
            return false;
        }
    }

    static async getUserByEmail(email: string) {
        const dataSource: DataSource = await getDataSource(); // Await getDataSource
        const userRepository = dataSource.getRepository(User);
        return await userRepository 
            .createQueryBuilder("user")
            .where("user.email = :email", { email })
            .getOne();
    }

    static async getEncryptedPassword(password: string): Promise<string> {
        let saltRounds: number = 10
        const hash: string = await bcrypt.hashSync(password, saltRounds);
        return hash;
    }

    static async comparePassword(password:string, hashPassword:string): Promise<boolean> {
        return await bcrypt.compare(password, hashPassword);
    }

    static generateToken(payload:Record<string, any>){
        let secret = process.env.JWT_SECRET!;
        // let token_expiry = process.env.JWT_TOKEN_EXPIRY!;
        // console.log(token_expiry);
        
        return jwt.sign(payload, secret, { expiresIn: '1d' })
        
    }

    static generateRefreshToken(payload:Record<string, any>){
        let secret = process.env.JWT_SECRET!;
        // let token_expiry = process.env.JWT_REFRESH_TOKEN_EXPIRY!;
        // console.log(secret);
        return jwt.sign(payload, secret, { expiresIn: '1h' })   
    }

    static verifyToken(token:string){
        let secret = process.env.JWT_SECRET!;
        let tokenData = jwt.verify(token, secret)
        console.log(tokenData)
        return tokenData;
        // if (typeof tokenData !== "string" && tokenData.id) {
        //     return tokenData.id;
        // } else {
        //     return token; // Or handle the case where 'id' is missing or tokenData is a string
        // }
        
    }
}
