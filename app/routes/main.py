"""
Main routes for the Serene application
"""
from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
from datetime import datetime

from app import db
from app.models.entry import Entry

# Create a blueprint for main routes
main = Blueprint('main', __name__)

@main.route('/')
def index():
    """Landing page for the application"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return render_template('index.html', title='Welcome to Serene')

@main.route('/dashboard')
@login_required
def dashboard():
    """Dashboard page with overall metrics and visualizations"""
    # Get recent entries
    recent_entries = Entry.query.filter_by(user_id=current_user.id) \
                               .order_by(Entry.date.desc()) \
                               .limit(5) \
                               .all()
    
    # Count entries by mood
    mood_counts = db.session.query(Entry.mood, db.func.count(Entry.id)) \
                            .filter(Entry.user_id == current_user.id) \
                            .group_by(Entry.mood) \
                            .all()
    
    # Format for chart
    mood_data = {mood: count for mood, count in mood_counts}
    
    # Check subscription status
    is_subscribed = current_user.is_subscribed
    is_in_trial = current_user.is_in_trial
    trial_days_left = 0
    
    if is_in_trial and current_user.trial_end_date:
        trial_days_left = max(0, (current_user.trial_end_date - datetime.utcnow()).days)
    
    return render_template('dashboard.html', 
                          title='Dashboard',
                          recent_entries=recent_entries,
                          mood_data=mood_data,
                          is_subscribed=is_subscribed,
                          is_in_trial=is_in_trial,
                          trial_days_left=trial_days_left)

@main.route('/settings')
@login_required
def settings():
    """User settings page"""
    return render_template('settings.html', title='Settings')

@main.route('/profile')
@login_required
def profile():
    """User profile page"""
    return render_template('profile.html', title='My Profile')

@main.route('/about')
def about():
    """About the application"""
    return render_template('about.html', title='About Serene')

@main.route('/privacy')
def privacy():
    """Privacy policy page"""
    return render_template('privacy.html', title='Privacy Policy')

@main.route('/terms')
def terms():
    """Terms of service page"""
    return render_template('terms.html', title='Terms of Service')