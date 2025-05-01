from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, Regexp

class SubscriptionForm(FlaskForm):
    plan = SelectField('Subscription Plan', 
                      choices=[('monthly', 'Monthly - $9.99/month'), 
                               ('annual', 'Annual - $89.99/year')], 
                      validators=[DataRequired()])
    
    # Credit card fields
    card_name = StringField('Cardholder Name', 
                          validators=[DataRequired(), 
                                     Length(min=2, max=120)])
    
    card_number = StringField('Card Number', 
                             validators=[DataRequired(), 
                                         Regexp(r'^\d{13,19}$', message="Please enter a valid card number.")])
    
    card_expiry = StringField('Expiration Date', 
                             validators=[DataRequired(), 
                                         Regexp(r'^(0[1-9]|1[0-2])\/([0-9]{2})$', message="Please enter a valid date in MM/YY format.")])
    
    card_cvv = StringField('CVV', 
                          validators=[DataRequired(), 
                                     Regexp(r'^\d{3,4}$', message="Please enter a valid CVV.")])
    
    submit = SubmitField('Subscribe')