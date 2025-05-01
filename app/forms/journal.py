"""
Journal forms for the Serene application
"""
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length

class JournalEntryForm(FlaskForm):
    mood = SelectField('Mood', 
                      choices=[('Happy', 'Happy'), 
                               ('Neutral', 'Neutral'), 
                               ('Sad', 'Sad'), 
                               ('Angry', 'Angry'), 
                               ('Tired', 'Tired')], 
                      validators=[DataRequired()])
    
    journal_entry = TextAreaField('Journal Entry', 
                                 validators=[DataRequired(), 
                                            Length(min=1, max=5000, message="Journal entry must be between 1 and 5000 characters.")])
    
    submit = SubmitField('Save Entry')