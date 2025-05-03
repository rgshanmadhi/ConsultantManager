#!/usr/bin/env python
"""
Serene - Mental Health Tracker Application
===================================
A comprehensive application to help users track and monitor their mental well-being
All functionality is consolidated into a single file for easier access and deployment
"""

import os
import json
import re
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, TextAreaField, SelectField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError, Regexp
from werkzeug.security import generate_password_hash, check_password_hash

#-----------------------------------------------
# FLASK APPLICATION SETUP
#-----------------------------------------------

# Create Flask application
app = Flask(__name__, template_folder='templates', static_folder='static')

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-development-only')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///serene.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

#-----------------------------------------------
# DATABASE MODELS
#-----------------------------------------------

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(120))
    is_subscribed = db.Column(db.Boolean, default=False)
    is_in_trial = db.Column(db.Boolean, default=True)
    trial_end_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    entries = db.relationship('Entry', backref='author', lazy='dynamic')
    subscriptions = db.relationship('Subscription', backref='user', lazy='dynamic')
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if self.trial_end_date is None:
            # Default trial period is 30 days
            self.trial_end_date = datetime.utcnow() + timedelta(days=30)
        
        # Handle password setting if provided
        if 'password' in kwargs:
            self.password = kwargs['password']
    
    @property
    def password(self):
        """Prevent password from being accessed"""
        raise AttributeError('password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        """Set password to a hashed password"""
        self.password_hash = generate_password_hash(password)
    
    def verify_password(self, password):
        """Check if hashed password matches user password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'name': self.name,
            'is_subscribed': self.is_subscribed,
            'is_in_trial': self.is_in_trial,
            'trial_end_date': self.trial_end_date.isoformat() if self.trial_end_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'


class Entry(db.Model):
    __tablename__ = 'entries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    mood = db.Column(db.String(20), nullable=False)  # "Happy", "Neutral", "Sad", "Angry", "Tired"
    journal_entry = db.Column(db.Text, nullable=False)
    sentiment = db.Column(db.String(20), nullable=True)  # "Positive", "Neutral", "Negative"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'mood': self.mood,
            'journal_entry': self.journal_entry,
            'sentiment': self.sentiment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Entry {self.id} {self.date.strftime("%Y-%m-%d")} {self.mood}>'


class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='active')  # active, canceled, past_due
    current_period_start = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    current_period_end = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Stripe fields for integration
    stripe_customer_id = db.Column(db.String(120), nullable=True)
    stripe_subscription_id = db.Column(db.String(120), nullable=True)
    plan = db.Column(db.String(20), nullable=False, default='monthly')  # monthly, annual
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'plan': self.plan,
            'stripe_customer_id': self.stripe_customer_id,
            'stripe_subscription_id': self.stripe_subscription_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Subscription {self.id} {self.user_id} {self.status}>'


#-----------------------------------------------
# FORMS
#-----------------------------------------------

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')


class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[
        DataRequired(),
        Length(min=3, max=64, message="Username must be between 3 and 64 characters.")
    ])
    email = StringField('Email', validators=[
        DataRequired(),
        Email(message="Please enter a valid email address."),
        Length(max=120)
    ])
    name = StringField('Name', validators=[
        Length(max=120, message="Name must be less than 120 characters.")
    ])
    password = PasswordField('Password', validators=[
        DataRequired(),
        Length(min=8, message="Password must be at least 8 characters long.")
    ])
    confirm_password = PasswordField('Confirm Password', validators=[
        DataRequired(),
        EqualTo('password', message="Passwords must match.")
    ])
    accept_tos = BooleanField('I accept the Terms of Service', validators=[
        DataRequired(message="You must accept the Terms of Service.")
    ])
    submit = SubmitField('Register')
    
    def validate_username(self, username):
        """Check if username is already taken"""
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username is already taken. Please choose a different one.')
    
    def validate_email(self, email):
        """Check if email is already registered"""
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email is already registered. Please use a different one or try logging in.')


class JournalEntryForm(FlaskForm):
    mood = SelectField('Mood', 
                      choices=[('Happy', 'Happy'), 
                               ('Neutral', 'Neutral'), 
                               ('Sad', 'Sad'), 
                               ('Angry', 'Angry'), 
                               ('Tired', 'Tired')], 
                      validators=[DataRequired()])
    
    journal_entry = TextAreaField('Journal Entry', 
                                 validators=[DataRequired(), 
                                            Length(min=1, max=5000, message="Journal entry must be between 1 and 5000 characters.")])
    
    submit = SubmitField('Save Entry')


class SubscriptionForm(FlaskForm):
    plan = SelectField('Subscription Plan', 
                      choices=[('monthly', 'Monthly - $9.99/month'), 
                               ('annual', 'Annual - $89.99/year')], 
                      validators=[DataRequired()])
    
    card_name = StringField('Cardholder Name', 
                          validators=[DataRequired(), 
                                     Length(min=2, max=120)])
    
    card_number = StringField('Card Number', 
                             validators=[DataRequired(), 
                                         Regexp(r'^\d{13,19}$', message="Please enter a valid card number.")])
    
    card_expiry = StringField('Expiration Date', 
                             validators=[DataRequired(), 
                                         Regexp(r'^(0[1-9]|1[0-2])\/([0-9]{2})$', message="Please enter a valid date in MM/YY format.")])
    
    card_cvv = StringField('CVV', 
                          validators=[DataRequired(), 
                                     Regexp(r'^\d{3,4}$', message="Please enter a valid CVV.")])
    
    submit = SubmitField('Subscribe')


#-----------------------------------------------
# UTILITY FUNCTIONS
#-----------------------------------------------

@login_manager.user_loader
def load_user(user_id):
    """User loader function for Flask-Login"""
    return User.query.get(int(user_id))


def format_date(date_string, format_string='%Y-%m-%d'):
    """Convert a date string to a formatted date"""
    if not date_string:
        return None
    try:
        date_obj = datetime.strptime(date_string, format_string)
        return date_obj
    except ValueError:
        return None


def format_datetime(dt, format_string='%B %d, %Y'):
    """Format a datetime object to a string"""
    if not dt:
        return ''
    return dt.strftime(format_string)


def get_date_range(days=30):
    """Get a date range for the past N days"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date


def analyze_sentiment(text):
    """
    A simple sentiment analysis function
    In a real app, this would use a proper NLP library or API
    """
    # Simple word-based sentiment analysis
    positive_words = ['happy', 'joy', 'love', 'excited', 'grateful', 'thankful', 'good', 'great', 
                      'excellent', 'amazing', 'wonderful', 'beautiful', 'accomplished', 'peaceful',
                      'calm', 'relaxed', 'content', 'pleased', 'delighted', 'cheerful', 'hopeful']
    
    negative_words = ['sad', 'angry', 'upset', 'depressed', 'anxious', 'worried', 'hate', 'dislike', 
                      'bad', 'terrible', 'awful', 'miserable', 'stressed', 'frustrated', 'annoyed',
                      'disappointed', 'unhappy', 'hurt', 'lonely', 'grief', 'pain', 'fear', 'scared']
    
    # Convert to lowercase and remove punctuation
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    words = text.split()
    
    # Count sentiment words
    positive_count = sum(1 for word in words if word in positive_words)
    negative_count = sum(1 for word in words if word in negative_words)
    
    # Determine sentiment
    if positive_count > negative_count:
        return 'Positive'
    elif negative_count > positive_count:
        return 'Negative'
    else:
        return 'Neutral'


def get_mood_emoji(mood):
    """Return emoji for a given mood"""
    mood_emojis = {
        'Happy': '😊',
        'Neutral': '😐',
        'Sad': '😔',
        'Angry': '😠',
        'Tired': '😴'
    }
    return mood_emojis.get(mood, '😐')


def get_mood_color(mood):
    """Return color for a given mood"""
    mood_colors = {
        'Happy': '#4ade80',  # green
        'Neutral': '#94a3b8', # gray
        'Sad': '#60a5fa',    # blue
        'Angry': '#f87171',  # red
        'Tired': '#c084fc'   # purple
    }
    return mood_colors.get(mood, '#94a3b8')


def get_sentiment_class(sentiment):
    """Return CSS class for a given sentiment"""
    sentiment_classes = {
        'Positive': 'sentiment-positive',
        'Neutral': 'sentiment-neutral',
        'Negative': 'sentiment-negative'
    }
    return sentiment_classes.get(sentiment, 'sentiment-neutral')


def get_subscription_status_class(status):
    """Return CSS class for a subscription status"""
    status_classes = {
        'active': 'text-success',
        'canceled': 'text-warning',
        'past_due': 'text-danger'
    }
    return status_classes.get(status, 'text-secondary')


#-----------------------------------------------
# TEMPLATE FILTERS
#-----------------------------------------------

@app.template_filter('formatdate')
def format_date_filter(date, format='%B %d, %Y'):
    """Format a date to a string with a given format"""
    if isinstance(date, str):
        try:
            date = datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return date
    return date.strftime(format) if date else ''


#-----------------------------------------------
# CONTEXT PROCESSORS
#-----------------------------------------------

@app.context_processor
def inject_now():
    """Inject the current datetime into templates"""
    return {'now': datetime.utcnow()}


#-----------------------------------------------
# ERROR HANDLERS
#-----------------------------------------------

@app.errorhandler(404)
def page_not_found(e):
    return render_template('errors/404.html'), 404


@app.errorhandler(500)
def internal_server_error(e):
    return render_template('errors/500.html'), 500


#-----------------------------------------------
# AUTHENTICATION ROUTES
#-----------------------------------------------

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login"""
    # Redirect if user is already logged in
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = LoginForm()
    
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user and user.verify_password(form.password.data):
            login_user(user, remember=form.remember.data)
            
            # Redirect to the requested page or dashboard
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))
        else:
            flash('Invalid username or password. Please try again.', 'danger')
    
    return render_template('auth/login.html', form=form, title='Login')


@app.route('/register', methods=['GET', 'POST'])
def register():
    """Handle user registration"""
    # Redirect if user is already logged in
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
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
        return redirect(url_for('login'))
    
    return render_template('auth/register.html', form=form, title='Register')


@app.route('/logout')
@login_required
def logout():
    """Handle user logout"""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))


#-----------------------------------------------
# API AUTHENTICATION ROUTES
#-----------------------------------------------

@app.route('/api/register', methods=['POST'])
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


@app.route('/api/login', methods=['POST'])
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


@app.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    """API endpoint for user logout"""
    logout_user()
    return jsonify({'success': True})


@app.route('/api/user')
@login_required
def api_user():
    """API endpoint to get current user info"""
    return jsonify(current_user.to_dict())


#-----------------------------------------------
# MAIN ROUTES
#-----------------------------------------------

@app.route('/')
def index():
    """Landing page for the application"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html', title='Welcome to Serene')


@app.route('/dashboard')
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


@app.route('/settings')
@login_required
def settings():
    """User settings page"""
    return render_template('settings.html', title='Settings')


@app.route('/profile')
@login_required
def profile():
    """User profile page"""
    return render_template('profile.html', title='My Profile')


@app.route('/about')
def about():
    """About the application"""
    return render_template('about.html', title='About Serene')


@app.route('/privacy')
def privacy():
    """Privacy policy page"""
    return render_template('privacy.html', title='Privacy Policy')


@app.route('/terms')
def terms():
    """Terms of service page"""
    return render_template('terms.html', title='Terms of Service')


#-----------------------------------------------
# JOURNAL ROUTES
#-----------------------------------------------

@app.route('/journal')
@login_required
def journal_page():
    """Journal page for creating and viewing entries"""
    form = JournalEntryForm()
    
    # Get the date parameter or default to today
    date_param = request.args.get('date')
    selected_date = None
    
    if date_param:
        try:
            selected_date = datetime.strptime(date_param, '%Y-%m-%d')
        except ValueError:
            selected_date = datetime.utcnow()
    else:
        selected_date = datetime.utcnow()
    
    # Format for query
    date_start = datetime(selected_date.year, selected_date.month, selected_date.day, 0, 0, 0)
    date_end = datetime(selected_date.year, selected_date.month, selected_date.day, 23, 59, 59)
    
    # Get entries for the selected day
    entries = Entry.query.filter(
        Entry.user_id == current_user.id,
        Entry.date >= date_start,
        Entry.date <= date_end
    ).order_by(Entry.date.desc()).all()
    
    # Get entries for the past month for the calendar view
    start_date, end_date = get_date_range(days=30)
    month_entries = Entry.query.filter(
        Entry.user_id == current_user.id,
        Entry.date >= start_date,
        Entry.date <= end_date
    ).all()
    
    # Group entries by date for calendar
    calendar_data = {}
    for entry in month_entries:
        date_key = entry.date.strftime('%Y-%m-%d')
        if date_key not in calendar_data:
            calendar_data[date_key] = {'count': 0, 'moods': []}
        calendar_data[date_key]['count'] += 1
        calendar_data[date_key]['moods'].append(entry.mood)
    
    return render_template('journal.html', 
                          title='Journal',
                          form=form,
                          entries=entries,
                          selected_date=selected_date,
                          calendar_data=json.dumps(calendar_data))


@app.route('/api/analyze-sentiment', methods=['POST'])
@login_required
def api_analyze_sentiment():
    """API endpoint for analyzing sentiment of text"""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    sentiment = analyze_sentiment(data['text'])
    
    return jsonify({'sentiment': sentiment})


@app.route('/api/entries', methods=['POST'])
@login_required
def create_entry():
    """API endpoint for creating a journal entry"""
    data = request.get_json()
    
    if not data or not all(key in data for key in ('mood', 'journal_entry')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Analyze sentiment if not provided
    sentiment = data.get('sentiment')
    if not sentiment:
        sentiment = analyze_sentiment(data['journal_entry'])
    
    # Create the entry
    entry = Entry(
        user_id=current_user.id,
        date=datetime.utcnow(),
        mood=data['mood'],
        journal_entry=data['journal_entry'],
        sentiment=sentiment
    )
    
    db.session.add(entry)
    db.session.commit()
    
    return jsonify(entry.to_dict()), 201


@app.route('/entries/<int:entry_id>', methods=['GET'])
@login_required
def view_entry(entry_id):
    """View a specific journal entry"""
    entry = Entry.query.get_or_404(entry_id)
    
    # Security check
    if entry.user_id != current_user.id:
        flash('You do not have permission to view this entry.', 'danger')
        return redirect(url_for('journal_page'))
    
    return render_template('entry_detail.html', title='Journal Entry', entry=entry)


@app.route('/entries/<int:entry_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_entry(entry_id):
    """Edit a journal entry"""
    entry = Entry.query.get_or_404(entry_id)
    
    # Security check
    if entry.user_id != current_user.id:
        flash('You do not have permission to edit this entry.', 'danger')
        return redirect(url_for('journal_page'))
    
    form = JournalEntryForm()
    
    if request.method == 'GET':
        form.mood.data = entry.mood
        form.journal_entry.data = entry.journal_entry
    
    if form.validate_on_submit():
        entry.mood = form.mood.data
        entry.journal_entry = form.journal_entry.data
        entry.sentiment = analyze_sentiment(form.journal_entry.data)
        
        db.session.commit()
        
        flash('Journal entry updated successfully.', 'success')
        return redirect(url_for('view_entry', entry_id=entry.id))
    
    return render_template('edit_entry.html', title='Edit Journal Entry', form=form, entry=entry)


@app.route('/entries/<int:entry_id>/delete', methods=['POST'])
@login_required
def delete_entry(entry_id):
    """Delete a journal entry"""
    entry = Entry.query.get_or_404(entry_id)
    
    # Security check
    if entry.user_id != current_user.id:
        flash('You do not have permission to delete this entry.', 'danger')
        return redirect(url_for('journal_page'))
    
    db.session.delete(entry)
    db.session.commit()
    
    flash('Journal entry deleted successfully.', 'success')
    return redirect(url_for('journal_page'))


#-----------------------------------------------
# WELLNESS ACTIVITIES/GAMES ROUTES
#-----------------------------------------------

@app.route('/games')
@login_required
def games_page():
    """Main games page showing available activities"""
    return render_template('games/index.html', title='Wellness Activities')


@app.route('/games/breathing')
@login_required
def breathing_exercise():
    """Breathing exercise game"""
    return render_template('games/breathing.html', title='Breathing Exercise')


@app.route('/games/memory')
@login_required
def memory_game():
    """Memory matching game"""
    return render_template('games/memory.html', title='Memory Game')


@app.route('/games/drawing')
@login_required
def zen_drawing():
    """Zen drawing activity"""
    return render_template('games/drawing.html', title='Zen Drawing')


@app.route('/games/meditation')
@login_required
def meditation():
    """Guided meditation activity"""
    return render_template('games/meditation.html', title='Guided Meditation')


@app.route('/games/gratitude')
@login_required
def gratitude():
    """Gratitude journaling activity"""
    return render_template('games/gratitude.html', title='Gratitude Journal')


@app.route('/games/affirmations')
@login_required
def affirmations():
    """Positive affirmations activity"""
    return render_template('games/affirmations.html', title='Positive Affirmations')


#-----------------------------------------------
# MAIN EXECUTION
#-----------------------------------------------

def create_demo_data():
    """Create demo data for testing"""
    # Add a demo user if none exists
    if not User.query.filter_by(username='demo').first():
        demo_user = User(
            username='demo',
            email='demo@example.com',
            name='Demo User',
            password='password',  # This will be hashed
            is_subscribed=False,
            is_in_trial=True,
            trial_end_date=datetime.utcnow() + timedelta(days=14)
        )
        db.session.add(demo_user)
        db.session.commit()
        
        # Add some sample entries
        moods = ['Happy', 'Neutral', 'Sad', 'Angry', 'Tired']
        entries = [
            "Today was a great day! I accomplished all my tasks and had time to relax.",
            "Feeling a bit tired today, but overall it was a productive day.",
            "I'm feeling down today. Nothing seems to be going right.",
            "Just a normal day, nothing special happened.",
            "I feel so energized today! My morning workout really set the tone for a productive day."
        ]
        
        for i in range(5):
            entry = Entry(
                user_id=demo_user.id,
                date=datetime.utcnow() - timedelta(days=i),
                mood=moods[i % len(moods)],
                journal_entry=entries[i % len(entries)],
                sentiment=analyze_sentiment(entries[i % len(entries)])
            )
            db.session.add(entry)
        
        db.session.commit()
        print("Demo data created!")


if __name__ == '__main__':
    # Create all database tables
    with app.app_context():
        db.create_all()
        
        # Uncomment to create demo data
        # create_demo_data()
    
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)