from flask import Blueprint, render_template, redirect, url_for, request, jsonify, flash, abort
from flask_login import login_required, current_user
from app import db
from app.models.user import User
from app.models.entry import Entry
from app.models.subscription import Subscription
from app.forms.subscription import SubscriptionForm
from datetime import datetime, timedelta
import json

# Create blueprint
main = Blueprint('main', __name__)

@main.route('/')
@login_required
def dashboard():
    """Dashboard page displaying user's mood data and recent entries"""
    # Get recent entries
    entries = Entry.query.filter_by(user_id=current_user.id).order_by(Entry.date.desc()).limit(5).all()
    
    return render_template('dashboard.html', entries=entries)

@main.route('/subscription', methods=['GET', 'POST'])
@login_required
def subscription():
    """Subscription management page"""
    form = SubscriptionForm()
    
    # Get current subscription
    current_subscription = Subscription.query.filter_by(
        user_id=current_user.id, 
        status='active'
    ).first()
    
    if form.validate_on_submit():
        # This is a simplified implementation without real payment processing
        # In production, you would integrate with Stripe or another payment processor
        
        # Calculate subscription end date based on plan
        if form.plan.data == 'monthly':
            end_date = datetime.utcnow() + timedelta(days=30)
        else:  # annual
            end_date = datetime.utcnow() + timedelta(days=365)
        
        # Create new subscription or update existing one
        if current_subscription:
            current_subscription.status = 'active'
            current_subscription.current_period_start = datetime.utcnow()
            current_subscription.current_period_end = end_date
            current_subscription.plan = form.plan.data
        else:
            new_subscription = Subscription(
                user_id=current_user.id,
                status='active',
                current_period_start=datetime.utcnow(),
                current_period_end=end_date,
                plan=form.plan.data
            )
            db.session.add(new_subscription)
        
        # Update user's subscription status
        current_user.is_subscribed = True
        current_user.is_in_trial = False
        
        db.session.commit()
        flash('Subscription successful!', 'success')
        return redirect(url_for('main.dashboard'))
    
    return render_template('subscription.html', form=form, subscription=current_subscription)

# API Routes
@main.route('/api/entries', methods=['GET'])
@login_required
def api_entries():
    """API endpoint to get user's journal entries"""
    # Check subscription
    if not current_user.is_subscribed and not current_user.is_in_trial:
        return jsonify({'message': 'Subscription required'}), 403
    
    entries = Entry.query.filter_by(user_id=current_user.id).order_by(Entry.date.desc()).all()
    return jsonify([entry.to_dict() for entry in entries])

@main.route('/api/entries/<date>', methods=['GET'])
@login_required
def api_entries_by_date(date):
    """API endpoint to get user's journal entries for a specific date"""
    # Check subscription
    if not current_user.is_subscribed and not current_user.is_in_trial:
        return jsonify({'message': 'Subscription required'}), 403
    
    try:
        target_date = datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        return jsonify({'message': 'Invalid date format, use YYYY-MM-DD'}), 400
    
    # Get entries from the specified date
    entries = Entry.query.filter_by(user_id=current_user.id).filter(
        db.func.date(Entry.date) == target_date.date()
    ).all()
    
    return jsonify([entry.to_dict() for entry in entries])

@main.route('/api/subscription', methods=['GET'])
@login_required
def api_subscription():
    """API endpoint to get user's subscription status"""
    user_data = {
        'isSubscribed': current_user.is_subscribed,
        'isInTrial': current_user.is_in_trial,
        'trialEndDate': current_user.trial_end_date.isoformat() if current_user.trial_end_date else None
    }
    
    # Get current subscription details if available
    subscription = Subscription.query.filter_by(
        user_id=current_user.id, 
        status='active'
    ).first()
    
    if subscription:
        user_data.update({
            'subscription': subscription.to_dict()
        })
    
    return jsonify(user_data)