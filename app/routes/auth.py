"""
Authentication routes for the Serene application
"""
from flask import Blueprint, render_template, flash, redirect, url_for, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from datetime import datetime, timedelta

from app import db
from app.models.user import User
from app.forms.auth import LoginForm, RegistrationForm

# Create a blueprint for authentication routes
auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login"""
    # Redirect if user is already logged in
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    form = LoginForm()
    
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user and user.verify_password(form.password.data):
            login_user(user, remember=form.remember.data)
            
            # Redirect to the requested page or dashboard
            next_page = request.args.get('next')
            return redirect(next_page or url_for('main.dashboard'))
        else:
            flash('Invalid username or password. Please try again.', 'danger')
    
    return render_template('auth/login.html', form=form, title='Login')

@auth.route('/register', methods=['GET', 'POST'])
def register():
    """Handle user registration"""
    # Redirect if user is already logged in
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    form = RegistrationForm()
    
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            name=form.name.data,
            password=form.password.data,
            trial_end_date=datetime.utcnow() + timedelta(days=30)
        )
        
        db.session.add(user)
        db.session.commit()
        
        flash('Account created successfully! You can now log in.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/register.html', form=form, title='Register')

@auth.route('/logout')
@login_required
def logout():
    """Handle user logout"""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('auth.login'))

# API Routes
@auth.route('/api/register', methods=['POST'])
def api_register():
    """API endpoint for user registration"""
    data = request.get_json()
    
    if not data or not all(key in data for key in ('username', 'email', 'password')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check for existing user
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        name=data.get('name', ''),
        password=data['password'],
        trial_end_date=datetime.utcnow() + timedelta(days=30)
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Log the user in
    login_user(user)
    
    return jsonify(user.to_dict()), 201

@auth.route('/api/login', methods=['POST'])
def api_login():
    """API endpoint for user login"""
    data = request.get_json()
    
    if not data or not all(key in data for key in ('username', 'password')):
        return jsonify({'error': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.verify_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    login_user(user)
    
    return jsonify(user.to_dict())

@auth.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    """API endpoint for user logout"""
    logout_user()
    return jsonify({'success': True})

@auth.route('/api/user')
@login_required
def api_user():
    """API endpoint to get current user info"""
    return jsonify(current_user.to_dict())