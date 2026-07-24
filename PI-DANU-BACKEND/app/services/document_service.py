import logging
import uuid
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)


class DocumentService:
    def __init__(self):
        self.bucket = settings.AWS_S3_BUCKET
        self.region = settings.AWS_REGION
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=self.region,
            )
        return self._client

    async def upload_document(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        application_id: str,
        document_type: str = "other",
    ) -> dict:
        file_key = f"applications/{application_id}/{document_type}/{uuid.uuid4()}_{filename}"
        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=file_key,
                Body=file_bytes,
                ContentType=content_type,
            )
            file_url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{file_key}"
            return {
                "file_url": file_url,
                "file_key": file_key,
                "original_filename": filename,
                "document_type": document_type,
            }
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise

    async def get_presigned_url(self, file_key: str, expires_in: int = 3600) -> str:
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": file_key},
                ExpiresIn=expires_in,
            )
            return url
        except ClientError as e:
            logger.error(f"Presigned URL generation failed: {e}")
            raise


document_service = DocumentService()
