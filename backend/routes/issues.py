import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from extensions import db
from models import Issue, IssueImage, StatusHistory

issues_bp = Blueprint('issues', __name__)


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


@issues_bp.route('', methods=['GET'])
def get_issues():
    category = request.args.get('category')
    status = request.args.get('status')
    priority = request.args.get('priority')
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)
    
    query = Issue.query
    
    if category and category in Issue.get_categories():
        query = query.filter(Issue.category == category)
    
    if status and status in Issue.get_statuses():
        query = query.filter(Issue.status == status)
    
    if priority and priority in Issue.get_priorities():
        query = query.filter(Issue.priority == priority)
    
    query = query.order_by(Issue.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    issues = [issue.to_dict() for issue in pagination.items]
    
    return jsonify({
        'issues': issues,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@issues_bp.route('/my', methods=['GET'])
@login_required
def get_my_issues():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)
    
    status = request.args.get('status')
    
    query = Issue.query.filter(Issue.user_id == current_user.id)
    
    if status and status in Issue.get_statuses():
        query = query.filter(Issue.status == status)
    
    query = query.order_by(Issue.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    issues = [issue.to_dict(include_admin_fields=True) for issue in pagination.items]
    
    return jsonify({
        'issues': issues,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@issues_bp.route('/<int:issue_id>', methods=['GET'])
def get_issue(issue_id):
    issue = Issue.query.get(issue_id)
    
    if not issue:
        return jsonify({'error': 'Issue not found'}), 404
    
    include_admin = current_user.is_authenticated and (
        current_user.is_admin() or issue.user_id == current_user.id
    )
    
    return jsonify({
        'issue': issue.to_dict(include_admin_fields=include_admin)
    }), 200


@issues_bp.route('', methods=['POST'])
@login_required
def create_issue():
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    category = request.form.get('category', 'others')
    latitude = request.form.get('latitude', type=float)
    longitude = request.form.get('longitude', type=float)
    location_address = request.form.get('location_address', '').strip()
    zipcode = request.form.get('zipcode', '').strip()
    
    if not title or len(title) < 5:
        return jsonify({'error': 'Title must be at least 5 characters'}), 400
    
    if category not in Issue.get_categories():
        return jsonify({'error': 'Invalid category'}), 400
    
    issue = Issue(
        title=title,
        description=description,
        category=category,
        latitude=latitude,
        longitude=longitude,
        location_address=location_address,
        zipcode=zipcode,
        user_id=current_user.id
    )
    
    db.session.add(issue)
    db.session.flush()
    
    files = request.files.getlist('images')
    
    for file in files[:5]:
        if file and allowed_file(file.filename):
            original_filename = secure_filename(file.filename)
            ext = original_filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{ext}"
            
            upload_folder = current_app.config['UPLOAD_FOLDER']
            file_path = os.path.join(upload_folder, unique_filename)
            file.save(file_path)
            
            file_size = os.path.getsize(file_path)
            
            image = IssueImage(
                issue_id=issue.id,
                file_path=unique_filename,
                original_filename=original_filename,
                file_size=file_size
            )
            db.session.add(image)
    
    status_history = StatusHistory(
        issue_id=issue.id,
        old_status=None,
        new_status=Issue.STATUS_NEW,
        changed_by=current_user.id,
        comment='Issue created'
    )
    db.session.add(status_history)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Issue reported successfully',
        'issue': issue.to_dict()
    }), 201


@issues_bp.route('/<int:issue_id>', methods=['PUT'])
@login_required
def update_issue(issue_id):
    issue = Issue.query.get(issue_id)
    
    if not issue:
        return jsonify({'error': 'Issue not found'}), 404
    
    if issue.user_id != current_user.id and not current_user.is_admin():
        return jsonify({'error': 'Permission denied'}), 403
    
    if issue.status != Issue.STATUS_NEW and not current_user.is_admin():
        return jsonify({'error': 'Cannot update issue that is being processed'}), 400
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    if 'title' in data:
        title = data['title'].strip()
        if len(title) < 5:
            return jsonify({'error': 'Title must be at least 5 characters'}), 400
        issue.title = title
    
    if 'description' in data:
        issue.description = data['description'].strip()
    
    if 'category' in data and data['category'] in Issue.get_categories():
        issue.category = data['category']
    
    if 'latitude' in data:
        issue.latitude = data['latitude']
    
    if 'longitude' in data:
        issue.longitude = data['longitude']
    
    if 'location_address' in data:
        issue.location_address = data['location_address'].strip()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Issue updated successfully',
        'issue': issue.to_dict()
    }), 200


@issues_bp.route('/<int:issue_id>', methods=['DELETE'])
@login_required
def delete_issue(issue_id):
    issue = Issue.query.get(issue_id)
    
    if not issue:
        return jsonify({'error': 'Issue not found'}), 404
    
    if issue.user_id != current_user.id and not current_user.is_admin():
        return jsonify({'error': 'Permission denied'}), 403
    
    if issue.status not in [Issue.STATUS_NEW, Issue.STATUS_REJECTED] and not current_user.is_admin():
        return jsonify({'error': 'Cannot delete issue that is being processed'}), 400
    
    for image in issue.images:
        try:
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], image.file_path)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass
    
    db.session.delete(issue)
    db.session.commit()
    
    return jsonify({'message': 'Issue deleted successfully'}), 200


@issues_bp.route('/categories', methods=['GET'])
def get_categories():
    return jsonify({
        'categories': [
            {'value': Issue.CATEGORY_ROADS, 'label': 'Roads & Infrastructure'},
            {'value': Issue.CATEGORY_LIGHTING, 'label': 'Street Lighting'},
            {'value': Issue.CATEGORY_SANITATION, 'label': 'Sanitation & Waste'},
            {'value': Issue.CATEGORY_ENVIRONMENT, 'label': 'Environment & Parks'},
            {'value': Issue.CATEGORY_OTHERS, 'label': 'Others'}
        ]
    }), 200


@issues_bp.route('/statuses', methods=['GET'])
def get_statuses():
    return jsonify({
        'statuses': [
            {'value': Issue.STATUS_NEW, 'label': 'New', 'color': 'primary'},
            {'value': Issue.STATUS_IN_PROGRESS, 'label': 'In Progress', 'color': 'warning'},
            {'value': Issue.STATUS_RESOLVED, 'label': 'Resolved', 'color': 'success'},
            {'value': Issue.STATUS_REJECTED, 'label': 'Rejected', 'color': 'danger'}
        ]
    }), 200


@issues_bp.route('/priorities', methods=['GET'])
def get_priorities():
    return jsonify({
        'priorities': [
            {'value': Issue.PRIORITY_LOW, 'label': 'Low', 'color': 'secondary'},
            {'value': Issue.PRIORITY_MEDIUM, 'label': 'Medium', 'color': 'info'},
            {'value': Issue.PRIORITY_HIGH, 'label': 'High', 'color': 'warning'},
            {'value': Issue.PRIORITY_URGENT, 'label': 'Urgent', 'color': 'danger'}
        ]
    }), 200