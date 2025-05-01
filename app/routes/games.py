from flask import Blueprint, render_template
from flask_login import login_required, current_user

games_bp = Blueprint('games', __name__)

@games_bp.route('/games')
@login_required
def games():
    # Check subscription status - games are available to all users
    return render_template('games.html')

@games_bp.route('/games/breathing')
@login_required
def breathing_exercise():
    return render_template('games/breathing.html')

@games_bp.route('/games/memory')
@login_required
def memory_game():
    return render_template('games/memory.html')

@games_bp.route('/games/drawing')
@login_required
def zen_drawing():
    return render_template('games/drawing.html')