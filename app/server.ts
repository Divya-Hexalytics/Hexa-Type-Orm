declare global {
  namespace Express {
    interface Request {
      data?: Record<string, any>; // Make it optional with '?'
      begin_timestamp?: Date | undefined
      user?: {
          uid: number;
          email: string;
          firstname: string;
          lastname: string;
      };
      
    }
  }
}

import express, { Request, Response, NextFunction } from "express";
import "dotenv/config";
import "reflect-metadata";
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from "express-rate-limit";
import cors from "cors";
import hpp from "hpp";


import RequestAndResponseLogger from "./utils/RequestAndResponseLogger";
import "./utils/Logger"; 

import userRoutes from "./routes/user.router"
import authRoutes from "./routes/auth.router"
import { getDataSource } from  "./database/index";
import ErrorResponse from "./utils/ErrorResponse";


try{
  
  // if database connection is proper, tehn proceed
  const dataSource = getDataSource();
  if(dataSource != null){
    
    const app = express();
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Disable the X-Powered-By header
    app.disable("x-powered-by");


    // Middleware: Enable gzip compression with the compression middleware
    app.use(compression());

    // Middleware: Apply the helmet middleware to set secure HTTP headers
    app.use(helmet());

    // Enable trust for proxy headers
    app.set("trust proxy", 1);
    
    // Middleware: Implement Rate Limiting to prevent abuse and brute-force attacks
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100000, // Limit each IP to 100 requests per windowMs
    });
    app.use(limiter);

    app.use(express.json({ limit: "50mb" }));
    app.use(
      express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 100 })
    );

    app.use(cors());

    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, PUT, POST, DELETE, OPTIONS'
      );
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      next();
    });

    // hpp middleware to protect against HTTP parameter pollution
    app.use(hpp());

    // Converts all query parameters to lower case
    app.use((req: Request, res: Response, next: NextFunction) => {
      const query = req.query;
      for (const key in query) {
        // if (Object.prototype.hasOwnProperty.call(query, key)) {
          const lowerCaseKey = key.toLocaleLowerCase();
          if (lowerCaseKey !== key) {
            query[lowerCaseKey] = query[key];
            delete query[key];
          }
        // }
      }
      next();
    });

    app.use(RequestAndResponseLogger);

    
    process.on("unhandledRejection", (error, promise) => {
      console.log(error);
    //   logger.error("Unhandled Rejection at: Promise", promise, "reason", error);
    });
    
    // process.on("uncaughtException", (error) => {
    //   logger.error("Uncaught Exception", error);
    // });
    

    app.use("/api/v1/user", userRoutes);
    app.use("/api/v1/auth", authRoutes);

    // Handle errors
    app.use((err: Error | ErrorResponse, req: Request, res: Response, next: NextFunction) => {
      // const errorResponse = new ErrorResponse(500, err.message, err.name);
      console.log("err: ",err)
      const errorResponse = new ErrorResponse(500, err.message, err.name, err.stack);
     
      res.status(500).json({
        success: errorResponse.success,
        code: errorResponse.code,
        message: errorResponse.message,
        errors: errorResponse.errors,
        stack: errorResponse.stack,
      });
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
}
catch(error) { console.log("TypeORM DataSource error: ", error)};
