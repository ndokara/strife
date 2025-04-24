import AWS from "aws-sdk";

const s3Endpoint: string | undefined = process.env.S3_ENDPOINT;
const s3AccessKey: string | undefined = process.env.S3_ACCESS_KEY;
const s3SecretKey: string | undefined = process.env.S3_SECRET_KEY;

if (!s3Endpoint) {
    console.error('minIO endpoint is not defined in environment variables.');
    process.exit(1);
}
if (!s3AccessKey) {
    console.error('minIO access key is not defined in environment variables.');
    process.exit(1);
}
if (!s3SecretKey) {
    console.error('minIO secret key is not defined in environment variables.');
    process.exit(1);
}
const s3 = new AWS.S3({
    endpoint: s3Endpoint,
    accessKeyId: s3AccessKey,
    secretAccessKey: s3SecretKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
});

export default s3;
