from flask import Blueprint, render_template, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timedelta
from app import db
from app.models import Entry, User, Subscription

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@login_required
def dashboard():
    # Check if user is in trial period or subscribed before showing the dashboard
    is_subscribed = current_user.is_subscribed
    is_in_trial = current_user.is_in_trial
    
    if not is_subscribed and not is_in_trial:
        return render_template('subscription.html')
    
    # Get recent entries for the dashboard
    entries = Entry.query.filter_by(user_id=current_user.id).order_by(Entry.date.desc()).limit(5).all()
    
    return render_template('dashboard.html', entries=entries)

@main_bp.route('/subscription')
@login_required
def subscription():
    # Get user's subscription status
    subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    
    return render_template('subscription.html', subscription=subscription)

@main_bp.route('/api/entries')
@login_required
def api_entries():
    # Check subscription status
    if not current_user.is_subscribed and not current_user.is_in_trial:
        return jsonify({'message': 'Subscription required'}), 403
    
    # Query all entries for the current user
    entries = Entry.query.filter_by(user_id=current_user.id).order_by(Entry.date.desc()).all()
    
    # Return as JSON
    return jsonify([entry.to_dict() for entry in entries]), 200

@main_bp.route('/api/entries/<date>')
@login_required
def api_entries_by_date(date):
    # Check subscription status
    if not current_user.is_subscribed and not current_user.is_in_trial:
        return jsonify({'message': 'Subscription required'}), 403
    
    try:
        # Parse the date from the request
        entry_date = datetime.strptime(date, '%Y-%m-%d')
        
        # Get the start and end of the requested day
        start_date = entry_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        
        # Query entries for that date
        entries = Entry.query.filter_by(user_id=current_user.id).filter(
            Entry.date >= start_date,
            Entry.date < end_date
        ).all()
        
        # Return as JSON
        return jsonify([entry.to_dict() for entry in entries]), 200
    
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400

@main_bp.route('/api/subscription')
@login_required
def api_subscription():
    # Check if user has a subscription
    subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    
    if subscription:
        return jsonify(subscription.to_dict()), 200
    
    # If no subscription, return trial information
    return jsonify({
        'isSubscribed': current_user.is_subscribed,
        'isInTrial': current_user.is_in_trial,
        'trialEndDate': current_user.trial_end_date.strftime('%Y-%m-%d') if current_user.trial_end_date else None
    }), 200