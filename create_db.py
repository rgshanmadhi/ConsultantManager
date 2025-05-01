from app import create_app, db
from app.models.user import User
from app.models.entry import Entry
from app.models.subscription import Subscription
from datetime import datetime, timedelta
import os

# Create application context
app = create_app()
app_context = app.app_context()
app_context.push()

# Create database tables
db.create_all()

# Check if admin user exists
admin = User.query.filter_by(username='admin').first()
if not admin:
    # Create admin user
    admin = User(
        username='admin',
        email='admin@example.com',
        name='Administrator',
        password='adminpassword',  # This will be hashed by the User model
        is_subscribed=True,  # Admin has full access
        is_in_trial=False
    )
    db.session.add(admin)
    
    # Create a subscription for admin
    admin_subscription = Subscription(
        user_id=1,  # This will be the admin's ID
        status='active',
        current_period_start=datetime.utcnow(),
        current_period_end=datetime.utcnow() + timedelta(days=365),
        plan='annual'
    )
    db.session.add(admin_subscription)
    
    db.session.commit()
    print("Admin user created.")
else:
    print("Admin user already exists.")

print("Database initialized successfully.")

# Pop application context
app_context.pop()