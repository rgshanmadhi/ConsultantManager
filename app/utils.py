"""
Utility functions for the Serene application
"""
import re
from datetime import datetime, timedelta
import json
from flask import current_app

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