import "dotenv/config";
import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const ENV = process.env.ENV;
const AWS_BUCKET_FOLDER = process.env.AWS_BUCKET_FOLDER;
const bucketName = process.env.AWS_BUCKET;
const BUCKET_URL = process.env.BUCKET_URL;

interface S3UploadResult {
  key: string;
  attachment: string;
}

const uploadFileToS3 = async (
  fileBuffer: Buffer,
  dynamicPath: string,
  customFileName: string
): Promise<S3UploadResult> => {
  try {
    if (!bucketName) {
      throw new Error("AWS_BUCKET environment variable is not set.");
    }
    if (!ENV) {
      throw new Error("ENV environment variable is not set.");
    }

    const destinationFileName = dynamicPath
      ? `${dynamicPath}/${customFileName}`
      : customFileName;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: `${AWS_BUCKET_FOLDER}/${destinationFileName}`,
      // Key: `${ENV}/${destinationFileName}`,
      Body: fileBuffer,
    };

    const data = await s3.upload(params).promise();

    if (data && data.Key && data.Location) {
      return {
        key: data.Key,
        attachment: data.Location,
      };
    } else {
      throw new Error("AWS S3 Upload response missing key or location");
    }
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
};

async function deleteFileFromBucket(filepath: string): Promise<AWS.S3.DeleteObjectOutput> {
  return new Promise((resolve, reject) => {
    if (!bucketName) {
      throw new Error("AWS_BUCKET environment variable is not set.");
    }

    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: bucketName,
      // Key: `${ENV}/${filepath}`,
      Key: `${AWS_BUCKET_FOLDER}/${filepath}`,
    };

    console.log(`delete params: ${JSON.stringify(params, null, 2)}`)
    s3.deleteObject(params, (err: AWS.AWSError, data: AWS.S3.DeleteObjectOutput) => {
      if (err) {
        console.error("Error deleting file:", err);
        return reject(err);
      } else {
        console.log("File deleted successfully:", data);
        return resolve(data);
      }
    });
  });
}

export { uploadFileToS3, deleteFileFromBucket };