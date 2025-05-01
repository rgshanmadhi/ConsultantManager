"""
Journal routes for the Serene application
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import json
import re

from app import db
from app.models.entry import Entry
from app.forms.journal import JournalEntryForm
from app.utils import analyze_sentiment, get_date_range

# Create a blueprint for journal routes
journal = Blueprint('journal', __name__)

@journal.route('/journal')
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

@journal.route('/api/analyze-sentiment', methods=['POST'])
@login_required
def api_analyze_sentiment():
    """API endpoint for analyzing sentiment of text"""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    sentiment = analyze_sentiment(data['text'])
    
    return jsonify({'sentiment': sentiment})

@journal.route('/api/entries', methods=['POST'])
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

@journal.route('/entries/<int:entry_id>', methods=['GET'])
@login_required
def view_entry(entry_id):
    """View a specific journal entry"""
    entry = Entry.query.get_or_404(entry_id)
    
    # Security check
    if entry.user_id != current_user.id:
        flash('You do not have permission to view this entry.', 'danger')
        return redirect(url_for('journal.journal_page'))
    
    return render_template('entry_detail.html', title='Journal Entry', entry=entry)

@journal.route('/entries/<int:entry_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_entry(entry_id):
    """Edit a journal entry"""
    entry = Entry.query.get_or_404(entry_id)
    
    # Security check
    if entry.user_id != current_user.id:
        flash('You do not have permission to edit this entry.', 'danger')
        return redirect(url_for('journal.journal_page'))
    
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
        return redirect(url_for('journal.view_entry', entry_id=entry.id))
    
    return render_template('edit_entry.html', title='Edit Journal Entry', form=form, entry=entry)

@journal.route('/entries/<int:entry_id>/delete', methods=['POST'])
@login_required
def delete_entry(entry_id):
    """Delete a journal entry"""
    entry = Entry.query.get_or_404(entry_id)
    
    # Security check
    if entry.user_id != current_user.id:
        flash('You do not have permission to delete this entry.', 'danger')
        return redirect(url_for('journal.journal_page'))
    
    db.session.delete(entry)
    db.session.commit()
    
    flash('Journal entry deleted successfully.', 'success')
    return redirect(url_for('journal.journal_page'))