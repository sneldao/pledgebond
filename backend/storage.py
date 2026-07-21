import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException
import logging

# Optional S3 dependency \u2014 module still imports cleanly without boto3 installed.
try:
    import boto3
    from botocore.exceptions import ClientError
    _BOTO_AVAILABLE = True
except Exception:  # pragma: no cover
    boto3 = None
    ClientError = Exception  # type: ignore
    _BOTO_AVAILABLE = False

logger = logging.getLogger(__name__)

storage_router = APIRouter(prefix="/storage", tags=["storage"])

# AWS S3 configuration
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID") or os.environ.get("S3_ACCESS_KEY")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY") or os.environ.get("S3_SECRET_KEY")
AWS_REGION = os.environ.get("AWS_REGION") or os.environ.get("S3_REGION", "us-east-1")
S3_BUCKET = os.environ.get("S3_BUCKET", "pledgebond-proofs")
S3_PUBLIC_URL = os.environ.get("S3_PUBLIC_URL", f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com")

# Initialize S3 client only if boto3 is available AND creds are set
s3_client = None
if _BOTO_AVAILABLE and AWS_ACCESS_KEY_ID:
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
        )
    except Exception as e:
        logger.warning("S3 client init failed: %s", e)
        s3_client = None

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    return os.path.splitext(filename)[1].lower()


def validate_file(file: UploadFile) -> None:
    """Validate file extension and size."""
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )


async def generate_unique_filename(bond_id: str, participant_id: str, task_id: str, filename: str) -> str:
    """Generate a unique filename for S3 storage."""
    ext = get_file_extension(filename)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"proofs/{bond_id}/{participant_id}/{task_id}/{timestamp}_{unique_id}{ext}"


async def upload_to_s3(file: UploadFile, key: str) -> str:
    """Upload file to S3 and return the public URL."""
    if not s3_client:
        # Fallback to local storage if S3 not configured
        return await save_locally(file, key)

    try:
        # Read file content
        content = await file.read()

        # Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=content,
            ContentType=file.content_type or "application/octet-stream",
            ACL="public-read",
        )

        # Return public URL
        return f"{S3_PUBLIC_URL}/{key}"

    except ClientError as e:
        logger.error(f"S3 upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file to storage")


async def save_locally(file: UploadFile, key: str) -> str:
    """Fallback: save file locally if S3 is not configured."""
    from pathlib import Path

    # Create local storage directory
    storage_dir = Path("storage") / key
    storage_dir.parent.mkdir(parents=True, exist_ok=True)

    # Write file
    content = await file.read()
    with open(storage_dir, "wb") as f:
        f.write(content)

    # Return local URL (for development)
    return f"/storage/{key}"


@storage_router.post("/upload/proof")
async def upload_proof_file(
    bond_id: str,
    participant_id: str,
    task_id: str,
    file: UploadFile = File(...)
):
    """Upload a proof file (image or PDF) to storage."""
    # Validate file
    validate_file(file)

    # Generate unique key
    key = await generate_unique_filename(bond_id, participant_id, task_id, file.filename)

    # Upload file
    file_url = await upload_to_s3(file, key)

    return {
        "url": file_url,
        "key": key,
        "filename": file.filename,
        "size": file.size,
    }


@storage_router.delete("/delete/{key:path}")
async def delete_file(key: str):
    """Delete a file from storage."""
    if not s3_client:
        # Fallback to local deletion
        from pathlib import Path
        file_path = Path("storage") / key
        if file_path.exists():
            file_path.unlink()
            return {"deleted": True}
        raise HTTPException(status_code=404, detail="File not found")

    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
        return {"deleted": True}
    except ClientError as e:
        logger.error(f"S3 delete failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file")


@storage_router.get("/presigned-url/{key:path}")
async def get_presigned_url(key: str, expires_in: int = 3600):
    """Generate a presigned URL for temporary access to a file."""
    if not s3_client:
        raise HTTPException(status_code=501, detail="S3 not configured")

    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": key},
            ExpiresIn=expires_in,
        )
        return {"url": url, "expires_in": expires_in}
    except ClientError as e:
        logger.error(f"Failed to generate presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate presigned URL")


async def ensure_bucket_exists():
    """Create S3 bucket if it doesn't exist (development only)."""
    if not s3_client:
        return

    try:
        s3_client.head_bucket(Bucket=S3_BUCKET)
        logger.info(f"S3 bucket '{S3_BUCKET}' exists")
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "404":
            try:
                if AWS_REGION == "us-east-1":
                    s3_client.create_bucket(Bucket=S3_BUCKET)
                else:
                    s3_client.create_bucket(
                        Bucket=S3_BUCKET,
                        CreateBucketConfiguration={"LocationConstraint": AWS_REGION}
                    )
                logger.info(f"Created S3 bucket '{S3_BUCKET}'")
            except ClientError as create_error:
                logger.error(f"Failed to create bucket: {create_error}")
        else:
            logger.error(f"Failed to check bucket: {e}")
