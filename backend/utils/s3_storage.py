import os
import uuid
from datetime import datetime

import boto3
from botocore.config import Config


class S3Manager:
    def __init__(self):
        self.bucket_name = os.getenv("S3_BUCKET_NAME", "").strip()
        region = os.getenv("AWS_REGION", "").strip()
        access_key = os.getenv("AWS_ACCESS_KEY_ID", "").strip()
        secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "").strip()
        if not all([self.bucket_name, region, access_key, secret_key]):
            raise ValueError("Missing AWS S3 environment configuration")
        self.client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version="s3v4"),
        )

    def upload_compliance_document(self, file_stream, filename: str, content_type: str = "application/pdf") -> str:
        safe_name = filename.replace(" ", "_")
        object_key = f"compliance/{datetime.utcnow().strftime('%Y/%m/%d')}/{uuid.uuid4().hex}_{safe_name}"
        self.client.upload_fileobj(
            file_stream,
            self.bucket_name,
            object_key,
            ExtraArgs={"ContentType": content_type},
        )
        return object_key

    def generate_presigned_url(self, object_key: str, expires_seconds: int = 900) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": object_key},
            ExpiresIn=expires_seconds,
        )
