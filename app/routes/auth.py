from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models.user import User
from app.forms.auth import LoginForm, RegistrationForm
from datetime import datetime, timedelta

# Create blueprint
auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user and user.verify_password(form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            flash('Login successful!', 'success')
            return redirect(next_page or url_for('main.dashboard'))
        else:
            flash('Invalid username or password.', 'danger')
    
    return render_template('auth/login.html', form=form)

@auth.route('/register', methods=['GET', 'POST'])
def register():
    """Handle user registration"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            name=form.name.data,
            password=form.password.data,
            is_in_trial=True,
            trial_end_date=datetime.utcnow() + timedelta(days=30)
        )
        db.session.add(user)
        db.session.commit()
        
        flash('Your account has been created! You can now log in.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/register.html', form=form)

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
    
    if not data:
        return jsonify({'message': 'No input data provided'}), 400
    
    # Check for required fields
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
    
    # Create user
    user = User(
        username=data['username'],
        email=data['email'],
        name=data.get('name', ''),
        password=data['password'],
        is_in_trial=True,
        trial_end_date=datetime.utcnow() + timedelta(days=30)
    )
    db.session.add(user)
    db.session.commit()
    
    login_user(user)
    
    return jsonify(user.to_dict()), 201

@auth.route('/api/login', methods=['POST'])
def api_login():
    """API endpoint for user login"""
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No input data provided'}), 400
    
    # Check for required fields
    required_fields = ['username', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.verify_password(data['password']):
        return jsonify({'message': 'Invalid username or password'}), 401
    
    login_user(user)
    
    return jsonify(user.to_dict())

@auth.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    """API endpoint for user logout"""
    logout_user()
    return jsonify({'message': 'Successfully logged out'})

@auth.route('/api/user')
@login_required
def api_user():
    """API endpoint to get current user info"""
    return jsonify(current_user.to_dict())