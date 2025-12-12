import { NextRequest, NextResponse } from "next/server";
import AWS from "aws-sdk";

// 1. Configuration (Set once on the server)
// DO Spaces is S3-compatible, so we use the AWS SDK.
// NOTE: Use the REGION endpoint, NOT the CDN endpoint (sfo3.digitaloceanspaces.com)
const SPACES_ENDPOINT = new AWS.Endpoint("sfo3.digitaloceanspaces.com");
const BUCKET_NAME = "beigeapp"; // Your Space name

const s3 = new AWS.S3({
  endpoint: SPACES_ENDPOINT,
  accessKeyId: process.env.DO_KEY,
  secretAccessKey: process.env.DO_SECRET,
  region: 'sfo3', // <-- MANDATORY: Region is required for S3 signing
  signatureVersion: "v4",
});

// 2. Server-Side Function to Get the Presigned URL
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {

  const { key } = await context.params;
  const videoKey = decodeURIComponent(key);

  if (!videoKey) {
    return NextResponse.json({ error: "Missing video key." }, { status: 400 });
  }

  try {
    const url = s3.getSignedUrl("getObject", {
      Bucket: BUCKET_NAME,
      Key: videoKey,
      Expires: 3600,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate video URL." },
      { status: 500 }
    );
  }
}
