from flask import Blueprint, render_template, redirect, url_for, request, jsonify, flash
from flask_login import login_required, current_user
from app import db
from app.models.entry import Entry
from app.forms.journal import JournalEntryForm
from datetime import datetime
import re

# Create blueprint
journal = Blueprint('journal', __name__)

@journal.route('/journal', methods=['GET', 'POST'])
@login_required
def journal():
    """Journal page for creating and viewing entries"""
    # Check subscription
    if not current_user.is_subscribed and not current_user.is_in_trial:
        flash('Your trial has ended. Please subscribe to continue using the journal.', 'warning')
        return redirect(url_for('main.subscription'))
    
    form = JournalEntryForm()
    if form.validate_on_submit():
        # Create entry with sentiment analysis
        entry = Entry(
            user_id=current_user.id,
            date=datetime.utcnow(),
            mood=form.mood.data,
            journal_entry=form.journal_entry.data,
            sentiment=analyze_sentiment(form.journal_entry.data)
        )
        db.session.add(entry)
        db.session.commit()
        
        flash('Journal entry saved successfully!', 'success')
        return redirect(url_for('journal.journal'))
    
    # Get recent entries for display
    entries = Entry.query.filter_by(user_id=current_user.id).order_by(Entry.date.desc()).all()
    
    return render_template('journal.html', form=form, entries=entries)

def analyze_sentiment(text):
    """
    A simple sentiment analysis function
    In a real app, this would use a proper NLP library or API
    """
    # Simple word-based sentiment analysis
    positive_words = ['happy', 'joy', 'love', 'excited', 'grateful', 'thankful', 'good', 'great', 'excellent', 'amazing', 'wonderful', 'beautiful', 'accomplished']
    negative_words = ['sad', 'angry', 'upset', 'depressed', 'anxious', 'worried', 'hate', 'dislike', 'bad', 'terrible', 'awful', 'miserable', 'stressed']
    
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

# API Routes
@journal.route('/api/analyze-sentiment', methods=['POST'])
@login_required
def api_analyze_sentiment():
    """API endpoint for analyzing sentiment of text"""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'message': 'No text provided'}), 400
    
    sentiment = analyze_sentiment(data['text'])
    
    return jsonify({'sentiment': sentiment})

@journal.route('/api/entries', methods=['POST'])
@login_required
def create_entry():
    """API endpoint for creating a journal entry"""
    # Check subscription
    if not current_user.is_subscribed and not current_user.is_in_trial:
        return jsonify({'message': 'Subscription required'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No input data provided'}), 400
    
    # Check for required fields
    required_fields = ['mood', 'journalEntry']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Create entry
    entry = Entry(
        user_id=current_user.id,
        date=datetime.utcnow(),
        mood=data['mood'],
        journal_entry=data['journalEntry'],
        sentiment=data.get('sentiment') or analyze_sentiment(data['journalEntry'])
    )
    db.session.add(entry)
    db.session.commit()
    
    return jsonify(entry.to_dict()), 201