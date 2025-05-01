// Main JavaScript file for Serene app

document.addEventListener('DOMContentLoaded', function() {
    // Handle flash message dismissal
    const flashMessages = document.querySelectorAll('.alert-dismissible');
    flashMessages.forEach(function(message) {
        const closeButton = message.querySelector('.btn-close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                message.remove();
            });
            
            // Auto-dismiss after 5 seconds
            setTimeout(function() {
                message.remove();
            }, 5000);
        }
    });
    
    // Add dark mode toggle functionality if it exists
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            
            // Save preference to localStorage
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        });
        
        // Check for saved preference
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
    }
    
    // Handle password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(function(toggle) {
        toggle.addEventListener('click', function() {
            const passwordField = document.getElementById(this.dataset.target);
            if (passwordField) {
                const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordField.setAttribute('type', type);
                
                // Toggle icon
                this.querySelector('i').classList.toggle('bi-eye');
                this.querySelector('i').classList.toggle('bi-eye-slash');
            }
        });
    });
});