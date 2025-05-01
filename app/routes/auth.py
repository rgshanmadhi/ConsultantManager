from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        name = request.form.get('name', '')
        
        # Validate inputs
        if not username or not email or not password:
            flash('Username, email, and password are required', 'error')
            return render_template('auth/register.html')
        
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
            return render_template('auth/register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists', 'error')
            return render_template('auth/register.html')
        
        # Create new user
        user = User(username=username, email=email, name=name)
        user.password = password  # This will hash the password
        
        db.session.add(user)
        db.session.commit()
        
        # Log in the new user
        login_user(user)
        
        return redirect(url_for('main.dashboard'))
    
    return render_template('auth/register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('Username and password are required', 'error')
            return render_template('auth/login.html')
        
        user = User.query.filter_by(username=username).first()
        
        if user is None or not user.verify_password(password):
            flash('Invalid username or password', 'error')
            return render_template('auth/login.html')
        
        login_user(user, remember=True)
        return redirect(url_for('main.dashboard'))
    
    return render_template('auth/login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

# API Routes for JavaScript fetch requests
@auth_bp.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    
    if not data or not all(k in data for k in ('username', 'email', 'password')):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        name=data.get('name', '')
    )
    user.password = data['password']  # This will hash the password
    
    db.session.add(user)
    db.session.commit()
    
    # Log in the new user
    login_user(user)
    
    return jsonify(user.to_dict()), 201

@auth_bp.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    
    if not data or not all(k in data for k in ('username', 'password')):
        return jsonify({'message': 'Username and password are required'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if user is None or not user.verify_password(data['password']):
        return jsonify({'message': 'Invalid username or password'}), 401
    
    login_user(user, remember=True)
    return jsonify(user.to_dict()), 200

@auth_bp.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/api/user')
@login_required
def api_user():
    return jsonify(current_user.to_dict()), 200