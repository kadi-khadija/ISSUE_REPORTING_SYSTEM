from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models import User, Issue, StatusHistory

admin_bp = Blueprint('admin', __name__)


def admin_required(func):
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper


@admin_bp.route('/issues', methods=['GET'])
@login_required
@admin_required
def get_all_issues():
    category = request.args.get('category')
    status = request.args.get('status')
    priority = request.args.get('priority')
    search = request.args.get('search', '').strip()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)
    
    query = Issue.query
    
    # Filter by the admin's zipcode!
    if current_user.zipcode:
        query = query.filter(Issue.zipcode == current_user.zipcode)
    
    if category and category in Issue.get_categories():
        query = query.filter(Issue.category == category)
    
    if status and status in Issue.get_statuses():
        query = query.filter(Issue.status == status)
    
    if priority and priority in Issue.get_priorities():
        query = query.filter(Issue.priority == priority)
    
    if search:
        query = query.filter(
            (Issue.title.ilike(f'%{search}%')) |
            (Issue.description.ilike(f'%{search}%')) |
            (Issue.location_address.ilike(f'%{search}%'))
        )
    
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


@admin_bp.route('/issues/<int:issue_id>/status', methods=['PUT'])
@login_required
@admin_required
def update_issue_status(issue_id):
    issue = Issue.query.get(issue_id)
    
    if not issue:
        return jsonify({'error': 'Issue not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    new_status = data.get('status')
    comment = data.get('comment', '').strip()
    
    if new_status not in Issue.get_statuses():
        return jsonify({'error': 'Invalid status'}), 400
    
    old_status = issue.status
    issue.status = new_status
    
    if new_status == Issue.STATUS_RESOLVED:
        issue.resolved_at = datetime.utcnow()
    elif old_status == Issue.STATUS_RESOLVED and new_status != Issue.STATUS_RESOLVED:
        issue.resolved_at = None
    
    status_history = StatusHistory(
        issue_id=issue.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=current_user.id,
        comment=comment
    )
    db.session.add(status_history)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Status updated successfully',
        'issue': issue.to_dict(include_admin_fields=True)
    }), 200


@admin_bp.route('/issues/<int:issue_id>/priority', methods=['PUT'])
@login_required
@admin_required
def update_issue_priority(issue_id):
    issue = Issue.query.get(issue_id)
    
    if not issue:
        return jsonify({'error': 'Issue not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    new_priority = data.get('priority')
    
    if new_priority not in Issue.get_priorities():
        return jsonify({'error': 'Invalid priority'}), 400
    
    issue.priority = new_priority
    db.session.commit()
    
    return jsonify({
        'message': 'Priority updated successfully',
        'issue': issue.to_dict(include_admin_fields=True)
    }), 200


@admin_bp.route('/issues/<int:issue_id>/notes', methods=['PUT'])
@login_required
@admin_required
def update_admin_notes(issue_id):
    issue = Issue.query.get(issue_id)
    
    if not issue:
        return jsonify({'error': 'Issue not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    issue.admin_notes = data.get('notes', '').strip()
    db.session.commit()
    
    return jsonify({
        'message': 'Notes updated successfully',
        'issue': issue.to_dict(include_admin_fields=True)
    }), 200


@admin_bp.route('/users', methods=['GET'])
@login_required
@admin_required
def get_all_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)
    
    role = request.args.get('role')
    search = request.args.get('search', '').strip()
    
    query = User.query
    
    if role:
        query = query.filter(User.role == role)
    
    if search:
        query = query.filter(
            (User.username.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%')) |
            (User.full_name.ilike(f'%{search}%'))
        )
    
    query = query.order_by(User.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    users = [user.to_dict(include_sensitive=True) for user in pagination.items]
    
    return jsonify({
        'users': users,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_user(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    if 'role' in data and data['role'] in ['citizen', 'admin']:
        user.role = data['role']
    
    if 'is_active' in data:
        user.is_active = bool(data['is_active'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    }), 200


@admin_bp.route('/stats', methods=['GET'])
@login_required
@admin_required
def get_statistics():
    issue_query = Issue.query
    if current_user.zipcode:
        issue_query = issue_query.filter(Issue.zipcode == current_user.zipcode)

    total_issues = issue_query.count()
    new_issues = issue_query.filter(Issue.status == Issue.STATUS_NEW).count()
    in_progress = issue_query.filter(Issue.status == Issue.STATUS_IN_PROGRESS).count()
    resolved = issue_query.filter(Issue.status == Issue.STATUS_RESOLVED).count()
    rejected = issue_query.filter(Issue.status == Issue.STATUS_REJECTED).count()
    
    category_counts = {}
    for category in Issue.get_categories():
        category_counts[category] = issue_query.filter(Issue.category == category).count()
    
    total_users = User.query.count()
    admin_users = User.query.filter(User.role == 'admin').count()
    citizen_users = User.query.filter(User.role == 'citizen').count()
    
    return jsonify({
        'issues': {
            'total': total_issues,
            'new': new_issues,
            'in_progress': in_progress,
            'resolved': resolved,
            'rejected': rejected,
            'by_category': category_counts
        },
        'users': {
            'total': total_users,
            'admins': admin_users,
            'citizens': citizen_users
        }
    }), 200