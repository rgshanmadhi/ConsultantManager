#!/usr/bin/env python
"""
Run script for the Serene Mental Health Tracker application
This script is used to run the application locally for development
"""

import os
from app import create_app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)