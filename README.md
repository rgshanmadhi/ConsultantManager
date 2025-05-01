# Serene - Mental Health Tracker

Serene is a comprehensive mental wellness application that helps users track their mood, journal their thoughts, and improve their mental well-being through insights and activities.

## Features

- **Mood Tracking**: Record your daily mood and see patterns over time
- **Journal**: Express your thoughts with a simple journaling interface
- **Sentiment Analysis**: Get insights into the emotional tone of your journal entries
- **Stress-Relief Games**: Access mindfulness activities like breathing exercises, memory games, and zen drawing
- **Data Visualization**: View your mood trends and gain insights into your emotional patterns

## Technology Stack

- **Backend**: Python/Flask
- **Database**: SQLAlchemy ORM with SQLite (or PostgreSQL for production)
- **Frontend**: Bootstrap, JavaScript, Chart.js
- **Authentication**: Flask-Login
- **Forms**: Flask-WTF with WTForms

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up environment variables by creating or editing `.env` file:
   ```
   SECRET_KEY=your-secret-key-change-in-production
   DATABASE_URL=sqlite:///serene.db
   FLASK_APP=wsgi.py
   FLASK_ENV=development
   ```
4. Initialize the database:
   ```
   python create_db.py
   ```
5. Run the application:
   ```
   python run.py
   ```

## Default Admin User

After initializing the database with `create_db.py`, a default admin user is created:
- Username: admin
- Password: adminpassword

**Important**: Change the default admin password in production!

## Usage

1. Open a web browser and navigate to `http://localhost:5000`
2. Log in with your account or create a new one
3. Start tracking your mood and journaling your thoughts
4. Explore the stress-relief games and activities
5. View your mood trends and insights

## Deployment

For production deployment:

1. Set up a production-ready database (PostgreSQL recommended)
2. Update the `DATABASE_URL` in your environment variables
3. Generate a strong secret key for `SECRET_KEY`
4. Consider using Gunicorn as a WSGI server:
   ```
   gunicorn wsgi:app
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.