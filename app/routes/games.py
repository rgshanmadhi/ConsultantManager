from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user

# Create blueprint
games = Blueprint('games', __name__)

@games.route('/games')
@login_required
def games():
    """Main games page showing available activities"""
    return render_template('games.html')

@games.route('/games/breathing')
@login_required
def breathing_exercise():
    """Breathing exercise game"""
    return render_template('games/breathing.html')

@games.route('/games/memory')
@login_required
def memory_game():
    """Memory matching game"""
    return render_template('games/memory.html')

@games.route('/games/drawing')
@login_required
def zen_drawing():
    """Zen drawing activity"""
    return render_template('games/drawing.html')