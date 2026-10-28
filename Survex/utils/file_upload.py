import os
import boto3
import cloudinary
import cloudinary.uploader
from config import Config
from werkzeug.utils import secure_filename
import uuid

# Initialize Cloudinary if configured
if Config.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=Config.CLOUDINARY_CLOUD_NAME,
        api_key=Config.CLOUDINARY_API_KEY,
        api_secret=Config.CLOUDINARY_API_SECRET
    )

def upload_to_s3(file, folder='uploads'):
    """Upload file to AWS S3"""
    if not Config.AWS_ACCESS_KEY_ID:
        raise Exception('AWS credentials not configured')
    
    s3_client = boto3.client(
        's3',
        aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY
    )
    
    filename = secure_filename(file.filename)
    unique_filename = f"{folder}/{uuid.uuid4()}_{filename}"
    
    s3_client.upload_fileobj(
        file,
        Config.AWS_S3_BUCKET,
        unique_filename,
        ExtraArgs={'ACL': 'public-read'}
    )
    
    url = f"https://{Config.AWS_S3_BUCKET}.s3.amazonaws.com/{unique_filename}"
    return url

def upload_to_cloudinary(file, folder='windsurf'):
    """Upload file to Cloudinary"""
    if not Config.CLOUDINARY_CLOUD_NAME:
        raise Exception('Cloudinary credentials not configured')
    
    result = cloudinary.uploader.upload(
        file,
        folder=folder,
        resource_type='auto'
    )
    
    return result['secure_url']

def upload_file(file, folder='uploads'):
    """
    Upload file to configured storage service
    Tries Cloudinary first, then S3, falls back to local storage
    """
    try:
        if Config.CLOUDINARY_CLOUD_NAME:
            return upload_to_cloudinary(file, folder)
        elif Config.AWS_ACCESS_KEY_ID:
            return upload_to_s3(file, folder)
        else:
            # Fallback: save locally
            upload_folder = os.path.join('static', folder)
            os.makedirs(upload_folder, exist_ok=True)
            
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(upload_folder, unique_filename)
            
            file.save(filepath)
            return f"/static/{folder}/{unique_filename}"
    except Exception as e:
        raise Exception(f"File upload failed: {str(e)}")

def allowed_file(filename, allowed_extensions={'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
