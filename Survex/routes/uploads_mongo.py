"""
File upload routes for Windsurf Platform
"""
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
import jwt
from PIL import Image

uploads_bp = Blueprint('uploads', __name__)

def init_uploads_routes(app, mongo):
    """Initialize upload routes with app and mongo instances"""
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = {
        'image': {'png', 'jpg', 'jpeg', 'gif', 'webp'},
        'document': {'pdf', 'doc', 'docx', 'txt'}
    }
    
    def allowed_file(filename, file_type=None):
        """Check if file extension is allowed"""
        if '.' not in filename:
            return False
        
        extension = filename.rsplit('.', 1)[1].lower()
        
        if file_type:
            return extension in ALLOWED_EXTENSIONS.get(file_type, set())
        
        # Check all allowed extensions
        all_extensions = set()
        for exts in ALLOWED_EXTENSIONS.values():
            all_extensions.update(exts)
        
        return extension in all_extensions
    
    def get_file_type(filename):
        """Determine file type based on extension"""
        if '.' not in filename:
            return 'unknown'
        
        extension = filename.rsplit('.', 1)[1].lower()
        
        for file_type, extensions in ALLOWED_EXTENSIONS.items():
            if extension in extensions:
                return file_type
        
        return 'unknown'
    
    def verify_token():
        """Verify JWT token and return user info"""
        token = request.headers.get('Authorization')
        if not token:
            return None
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            return payload
        except:
            return None
    
    def compress_image(file_path, max_size=(1920, 1080), quality=85):
        """Compress image file"""
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Resize if larger than max_size
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Save with compression
                img.save(file_path, 'JPEG', quality=quality, optimize=True)
                
        except Exception as e:
            print(f"Image compression error: {e}")
    
    @uploads_bp.route('/proof', methods=['POST'])
    def upload_proof_files():
        """Upload proof files for challenge submissions"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Check if files are present
            if 'files' not in request.files:
                return jsonify({'error': 'No files provided'}), 400
            
            files = request.files.getlist('files')
            challenge_id = request.form.get('challenge_id')
            description = request.form.get('description', '')
            
            if not challenge_id:
                return jsonify({'error': 'Challenge ID is required'}), 400
            
            if not files or all(file.filename == '' for file in files):
                return jsonify({'error': 'No files selected'}), 400
            
            # Validate files
            for file in files:
                if not allowed_file(file.filename):
                    return jsonify({'error': f'File type not allowed: {file.filename}'}), 400
            
            # Create upload directory if it doesn't exist
            upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'submissions', user['user_id'])
            os.makedirs(upload_dir, exist_ok=True)
            
            uploaded_files = []
            
            for file in files:
                if file and file.filename != '':
                    # Generate unique filename
                    file_extension = file.filename.rsplit('.', 1)[1].lower()
                    unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                    file_path = os.path.join(upload_dir, unique_filename)
                    
                    # Save file
                    file.save(file_path)
                    
                    # Compress image if it's an image file
                    file_type = get_file_type(file.filename)
                    if file_type == 'image':
                        compress_image(file_path)
                    
                    # Get file size
                    file_size = os.path.getsize(file_path)
                    
                    # Create file metadata
                    file_metadata = {
                        'original_name': file.filename,
                        'filename': unique_filename,
                        'file_path': file_path,
                        'file_type': file_type,
                        'file_size': file_size,
                        'mime_type': file.mimetype,
                        'url': f"/api/uploads/submissions/{user['user_id']}/{unique_filename}",
                        'uploaded_at': datetime.utcnow()
                    }
                    
                    uploaded_files.append(file_metadata)
            
            # Create submission record
            submission_data = {
                'student_id': user['user_id'],
                'challenge_id': challenge_id,
                'proof_files': uploaded_files,
                'proof_description': description,
                'verification_status': 'pending',
                'submitted_at': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Insert submission
            result = mongo.db.submissions.insert_one(submission_data)
            submission_data['_id'] = result.inserted_id
            
            # Update joined challenge status
            mongo.db.joined_challenges.update_one(
                {
                    'student_id': user['user_id'],
                    'challenge_id': challenge_id
                },
                {
                    '$set': {
                        'submitted_proof': True,
                        'proof_status': 'under_review',
                        'proof_files': uploaded_files,
                        'proof_description': description,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
            # Serialize response
            def serialize_doc(doc):
                if isinstance(doc, dict):
                    result = {}
                    for key, value in doc.items():
                        if key == '_id':
                            result[key] = str(value)
                        elif isinstance(value, datetime):
                            result[key] = value.isoformat()
                        elif isinstance(value, list):
                            result[key] = [serialize_doc(item) for item in value]
                        elif isinstance(value, dict):
                            result[key] = serialize_doc(value)
                        else:
                            result[key] = value
                    return result
                return doc
            
            return jsonify({
                'message': 'Files uploaded successfully',
                'submission': serialize_doc(submission_data),
                'files_uploaded': len(uploaded_files)
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @uploads_bp.route('/avatar', methods=['POST'])
    def upload_avatar():
        """Upload user avatar"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            if 'file' not in request.files:
                return jsonify({'error': 'No file provided'}), 400
            
            file = request.files['file']
            
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            if not allowed_file(file.filename, 'image'):
                return jsonify({'error': 'Only image files are allowed for avatars'}), 400
            
            # Create avatar directory
            avatar_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'avatars')
            os.makedirs(avatar_dir, exist_ok=True)
            
            # Generate unique filename
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"avatar_{user['user_id']}.{file_extension}"
            file_path = os.path.join(avatar_dir, unique_filename)
            
            # Save and compress image
            file.save(file_path)
            compress_image(file_path, max_size=(300, 300), quality=90)
            
            # Update user avatar in database
            avatar_url = f"/api/uploads/avatars/{unique_filename}"
            mongo.db.users.update_one(
                {'_id': user['user_id']},
                {
                    '$set': {
                        'avatar_url': avatar_url,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
            return jsonify({
                'message': 'Avatar uploaded successfully',
                'avatar_url': avatar_url
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @uploads_bp.route('/submissions/<user_id>/<filename>')
    def serve_submission_file(user_id, filename):
        """Serve uploaded submission files"""
        try:
            # Verify access (user can access their own files, admins can access all)
            current_user = verify_token()
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            if current_user.get('role') != 'admin' and current_user['user_id'] != user_id:
                return jsonify({'error': 'Access denied'}), 403
            
            file_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'submissions', user_id)
            return send_from_directory(file_dir, filename)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 404
    
    @uploads_bp.route('/avatars/<filename>')
    def serve_avatar_file(filename):
        """Serve avatar files"""
        try:
            avatar_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'avatars')
            return send_from_directory(avatar_dir, filename)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 404
    
    @uploads_bp.route('/posts', methods=['POST'])
    def upload_post_media():
        """Upload media files for posts"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            if 'files' not in request.files:
                return jsonify({'error': 'No files provided'}), 400
            
            files = request.files.getlist('files')
            
            if not files or all(file.filename == '' for file in files):
                return jsonify({'error': 'No files selected'}), 400
            
            # Create posts directory
            posts_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'posts', user['user_id'])
            os.makedirs(posts_dir, exist_ok=True)
            
            uploaded_files = []
            
            for file in files:
                if file and file.filename != '':
                    if not allowed_file(file.filename, 'image'):
                        continue  # Skip non-image files for posts
                    
                    # Generate unique filename
                    file_extension = file.filename.rsplit('.', 1)[1].lower()
                    unique_filename = f"post_{uuid.uuid4().hex}.{file_extension}"
                    file_path = os.path.join(posts_dir, unique_filename)
                    
                    # Save and compress image
                    file.save(file_path)
                    compress_image(file_path)
                    
                    file_url = f"/api/uploads/posts/{user['user_id']}/{unique_filename}"
                    uploaded_files.append({
                        'original_name': file.filename,
                        'filename': unique_filename,
                        'url': file_url,
                        'uploaded_at': datetime.utcnow().isoformat()
                    })
            
            return jsonify({
                'message': 'Media files uploaded successfully',
                'files': uploaded_files
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @uploads_bp.route('/posts/<user_id>/<filename>')
    def serve_post_media(user_id, filename):
        """Serve post media files"""
        try:
            file_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'posts', user_id)
            return send_from_directory(file_dir, filename)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 404
    
    @uploads_bp.route('/info/<file_type>/<user_id>/<filename>')
    def get_file_info(file_type, user_id, filename):
        """Get file information"""
        try:
            current_user = verify_token()
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Check access permissions
            if current_user.get('role') != 'admin' and current_user['user_id'] != user_id:
                return jsonify({'error': 'Access denied'}), 403
            
            file_dir = os.path.join(app.config['UPLOAD_FOLDER'], file_type, user_id)
            file_path = os.path.join(file_dir, filename)
            
            if not os.path.exists(file_path):
                return jsonify({'error': 'File not found'}), 404
            
            file_stats = os.stat(file_path)
            file_info = {
                'filename': filename,
                'size': file_stats.st_size,
                'created': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                'modified': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                'file_type': get_file_type(filename)
            }
            
            return jsonify({'file_info': file_info}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @uploads_bp.route('/delete/<file_type>/<user_id>/<filename>', methods=['DELETE'])
    def delete_file(file_type, user_id, filename):
        """Delete uploaded file"""
        try:
            current_user = verify_token()
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Check permissions (user can delete their own files, admins can delete any)
            if current_user.get('role') != 'admin' and current_user['user_id'] != user_id:
                return jsonify({'error': 'Access denied'}), 403
            
            file_dir = os.path.join(app.config['UPLOAD_FOLDER'], file_type, user_id)
            file_path = os.path.join(file_dir, filename)
            
            if not os.path.exists(file_path):
                return jsonify({'error': 'File not found'}), 404
            
            os.remove(file_path)
            
            return jsonify({'message': 'File deleted successfully'}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return uploads_bp
