"""
Serene - Mental Health Tracker Application
===================================
A comprehensive application to help users track and monitor their mental well-being
"""

# This file serves as a package marker
# All Flask application initialization is now in run.py

# Backwards compatibility - create_app function for existing imports
def create_app():
    """Function for backwards compatibility"""
    from run import app
    return app