import AWS from "aws-sdk";

const minioEndpoint: string | undefined = process.env.MINIO_ENDPOINT;
const minioAccessKey: string | undefined = process.env.MINIO_ACCESS_KEY;
const minioSecretKey: string | undefined = process.env.MINIO_SECRET_KEY;

if(!minioEndpoint){
    console.error('minIO endpoint is not defined in environment variables.');
    process.exit(1);
}
if(!minioAccessKey){
    console.error('minIO access key is not defined in environment variables.');
    process.exit(1);
}
if(!minioSecretKey){
    console.error('minIO secret key is not defined in environment variables.');
    process.exit(1);
}
const s3 = new AWS.S3({
    endpoint: process.env.MINIO_ENDPOINT,
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
});

export default s3;
