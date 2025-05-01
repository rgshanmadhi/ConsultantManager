#!/usr/bin/env python
"""
Script to generate demo data for the Serene application
This will populate the database with sample users, entries, and subscriptions
"""
import os
import sys
import random
from datetime import datetime, timedelta

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.user import User
from app.models.entry import Entry
from app.models.subscription import Subscription
from app.utils import analyze_sentiment

# Sample data
SAMPLE_MOODS = ['Happy', 'Neutral', 'Sad', 'Angry', 'Tired']

SAMPLE_ENTRIES = [
    "Today was a great day! I accomplished all my tasks and had time to relax.",
    "Feeling a bit tired today, but overall it was a productive day.",
    "I'm feeling down today. Nothing seems to be going right.",
    "Why does everything have to be so difficult? I'm frustrated with how things are going.",
    "Just a normal day, nothing special happened.",
    "I feel so energized today! My morning workout really set the tone for a productive day.",
    "I'm anxious about the upcoming presentation, but trying to stay positive.",
    "Spent time with friends today which really lifted my spirits.",
    "Feeling overwhelmed with all the deadlines coming up.",
    "Had a relaxing day reading and enjoying some quiet time.",
    "Didn't sleep well last night, feeling exhausted today.",
    "Celebrated a small victory at work today, feeling proud of myself.",
    "Missing my family today, feeling a bit lonely.",
    "Tried a new meditation technique and feeling very peaceful.",
    "Received some criticism at work that was hard to hear.",
]

def create_demo_users():
    """Create demo users"""
    # Create a regular user
    user = User.query.filter_by(username='demouser').first()
    if not user:
        user = User(
            username='demouser',
            email='demo@example.com',
            name='Demo User',
            password='password',  # This will be hashed
            is_subscribed=False,
            is_in_trial=True,
            trial_end_date=datetime.utcnow() + timedelta(days=14)
        )
        db.session.add(user)
        print("Created demo user")
    else:
        print("Demo user already exists")
    
    # Create a subscribed user
    sub_user = User.query.filter_by(username='subscriber').first()
    if not sub_user:
        sub_user = User(
            username='subscriber',
            email='subscriber@example.com',
            name='Subscribed User',
            password='password',  # This will be hashed
            is_subscribed=True,
            is_in_trial=False
        )
        db.session.add(sub_user)
        print("Created subscriber user")
    else:
        print("Subscriber user already exists")
    
    db.session.commit()
    return user, sub_user

def create_demo_entries(user, count=30):
    """Create demo journal entries for the past month"""
    # Remove any existing entries for this user
    Entry.query.filter_by(user_id=user.id).delete()
    
    # Create entries for the past 30 days
    for i in range(count):
        date = datetime.utcnow() - timedelta(days=i)
        mood = random.choice(SAMPLE_MOODS)
        entry_text = random.choice(SAMPLE_ENTRIES)
        
        entry = Entry(
            user_id=user.id,
            date=date,
            mood=mood,
            journal_entry=entry_text,
            sentiment=analyze_sentiment(entry_text)
        )
        db.session.add(entry)
    
    db.session.commit()
    print(f"Created {count} entries for {user.username}")

def create_demo_subscription(user):
    """Create a demo subscription"""
    # Check if user already has a subscription
    existing_sub = Subscription.query.filter_by(user_id=user.id).first()
    if existing_sub:
        print(f"Subscription already exists for {user.username}")
        return
    
    subscription = Subscription(
        user_id=user.id,
        status='active',
        current_period_start=datetime.utcnow() - timedelta(days=5),
        current_period_end=datetime.utcnow() + timedelta(days=25),
        plan='monthly'
    )
    db.session.add(subscription)
    db.session.commit()
    print(f"Created subscription for {user.username}")

def main():
    """Main function to generate demo data"""
    app = create_app()
    with app.app_context():
        print("Generating demo data...")
        
        # Create users
        user, subscriber = create_demo_users()
        
        # Create entries
        create_demo_entries(user, count=15)
        create_demo_entries(subscriber, count=30)
        
        # Create subscription for subscribed user
        create_demo_subscription(subscriber)
        
        print("Demo data generation complete!")

if __name__ == "__main__":
    main()