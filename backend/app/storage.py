"""
ThaiWrite AI - S3-Compatible Storage Service

Handles file upload/download to S3-compatible bucket (AWS S3, MinIO, etc.).
"""

import os
import uuid
from typing import Optional

import boto3
from botocore.exceptions import ClientError

# ── Configuration from environment ──
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", None)  # e.g. http://localhost:9000 for MinIO
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
S3_BUCKET_NAME = os.getenv("STORAGE_BUCKET_NAME", "thaiwrite-docs")
S3_REGION = os.getenv("S3_REGION", "ap-southeast-1")


def _get_s3_client():
    """Create an S3 client using environment config."""
    params = {
        "service_name": "s3",
        "region_name": S3_REGION,
        "aws_access_key_id": S3_ACCESS_KEY,
        "aws_secret_access_key": S3_SECRET_KEY,
    }
    if S3_ENDPOINT_URL:
        params["endpoint_url"] = S3_ENDPOINT_URL
    return boto3.client(**params)


def ensure_bucket_exists():
    """Create the bucket if it doesn't exist (useful for local MinIO dev)."""
    s3 = _get_s3_client()
    try:
        s3.head_bucket(Bucket=S3_BUCKET_NAME)
    except ClientError:
        s3.create_bucket(
            Bucket=S3_BUCKET_NAME,
            CreateBucketConfiguration={"LocationConstraint": S3_REGION},
        )


async def upload_file(file_bytes: bytes, original_filename: str, content_type: str = "application/octet-stream") -> str:
    """
    Upload file bytes to S3 and return the object key.

    Returns:
        str: The S3 object key (path) for the uploaded file.
    """
    ext = os.path.splitext(original_filename)[1] if "." in original_filename else ""
    object_key = f"uploads/{uuid.uuid4().hex}{ext}"

    s3 = _get_s3_client()
    s3.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=object_key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return object_key


def get_download_url(object_key: str, expires_in: int = 3600) -> str:
    """Generate a pre-signed URL for downloading a file."""
    s3 = _get_s3_client()
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET_NAME, "Key": object_key},
        ExpiresIn=expires_in,
    )
    return url


async def delete_file(object_key: str) -> bool:
    """Delete a file from S3."""
    s3 = _get_s3_client()
    try:
        s3.delete_object(Bucket=S3_BUCKET_NAME, Key=object_key)
        return True
    except ClientError:
        return False
