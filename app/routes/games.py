"""
Games and activities routes for the Serene application
"""
from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from flask_login import login_required, current_user

from app import db

# Create a blueprint for games routes
games = Blueprint('games', __name__)

@games.route('/games')
@login_required
def games_page():
    """Main games page showing available activities"""
    return render_template('games/index.html', title='Wellness Activities')

@games.route('/games/breathing')
@login_required
def breathing_exercise():
    """Breathing exercise game"""
    return render_template('games/breathing.html', title='Breathing Exercise')

@games.route('/games/memory')
@login_required
def memory_game():
    """Memory matching game"""
    return render_template('games/memory.html', title='Memory Game')

@games.route('/games/drawing')
@login_required
def zen_drawing():
    """Zen drawing activity"""
    return render_template('games/drawing.html', title='Zen Drawing')

@games.route('/games/meditation')
@login_required
def meditation():
    """Guided meditation activity"""
    return render_template('games/meditation.html', title='Guided Meditation')

@games.route('/games/gratitude')
@login_required
def gratitude():
    """Gratitude journaling activity"""
    return render_template('games/gratitude.html', title='Gratitude Journal')

@games.route('/games/affirmations')
@login_required
def affirmations():
    """Positive affirmations activity"""
    return render_template('games/affirmations.html', title='Positive Affirmations')