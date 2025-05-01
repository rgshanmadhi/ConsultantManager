from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
import re
from app import db
from app.models import Entry

journal_bp = Blueprint('journal', __name__)

@journal_bp.route('/journal')
@login_required
def journal():
    # Check subscription status
    if not current_user.is_subscribed and not current_user.is_in_trial:
        return render_template('subscription.html')
    
    # Load the journal page
    return render_template('journal.html')

def analyze_sentiment(text):
    """
    A simple sentiment analysis function
    In a real app, this would use a proper NLP library or API
    """
    # Simple keyword-based sentiment analysis
    positive_words = ['happy', 'good', 'great', 'excellent', 'joy', 'love', 'amazing', 'wonderful']
    negative_words = ['sad', 'bad', 'terrible', 'awful', 'angry', 'hate', 'upset', 'disappointing']
    
    # Convert text to lowercase and tokenize
    text = text.lower()
    words = re.findall(r'\b\w+\b', text)
    
    # Count sentiment words
    positive_count = sum(1 for word in words if word in positive_words)
    negative_count = sum(1 for word in words if word in negative_words)
    
    # Determine sentiment
    if positive_count > negative_count:
        return "Positive"
    elif negative_count > positive_count:
        return "Negative"
    else:
        return "Neutral"

@journal_bp.route('/api/entries', methods=['POST'])
@login_required
def create_entry():
    # Check subscription status
    if not current_user.is_subscribed and not current_user.is_in_trial:
        return jsonify({'message': 'Subscription required'}), 403
    
    # Get data from request
    data = request.get_json()
    
    if not data or not all(k in data for k in ('mood', 'journalEntry')):
        return jsonify({'message': 'Mood and journal entry are required'}), 400
    
    # Analyze sentiment if not provided
    sentiment = data.get('sentiment')
    if not sentiment:
        sentiment = analyze_sentiment(data['journalEntry'])
    
    # Create new entry
    entry = Entry(
        user_id=current_user.id,
        mood=data['mood'],
        journal_entry=data['journalEntry'],
        sentiment=sentiment,
        date=datetime.utcnow()
    )
    
    db.session.add(entry)
    db.session.commit()
    
    return jsonify(entry.to_dict()), 201

@journal_bp.route('/api/analyze-sentiment', methods=['POST'])
@login_required
def api_analyze_sentiment():
    # Check subscription status
    if not current_user.is_subscribed and not current_user.is_in_trial:
        return jsonify({'message': 'Subscription required'}), 403
    
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'message': 'Text is required'}), 400
    
    # Analyze sentiment
    sentiment = analyze_sentiment(data['text'])
    
    return jsonify({'sentiment': sentiment}), 200