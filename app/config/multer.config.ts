import multer, { StorageEngine, FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

const fileSizeLimit = 10 * 1024 * 1024; // 10 MB

// Define types for better type safety
interface MulterRequest extends Request {
  file: Express.Multer.File;
}

export const fileStorage: StorageEngine = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, path.join(process.cwd(), process.env.ATTACHMENT_PATH || "uploads")); //provide a default value in case of undefined env variable
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        "-" +
        file.originalname
    );
  },
});

export const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "application/pdf"
  ) {
    return cb(null, true);
  }
  return cb(new Error("Only JPEG, PNG, or PDF files are allowed"));
};

export const sizeLimit = {
  fileSize: fileSizeLimit,
};

export const storage: StorageEngine = multer.memoryStorage();