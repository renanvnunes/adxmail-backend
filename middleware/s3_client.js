import { S3 } from "@aws-sdk/client-s3";
import 'dotenv/config'

const s3Client = new S3({
	endpoint: process.env.DO_SP_ENDPOINT,
	region: "us-east-1",
	credentials: {
		accessKeyId: process.env.DO_SP_KEY,
		secretAccessKey: process.env.DO_SP_SECRET
	}
});

export { s3Client };