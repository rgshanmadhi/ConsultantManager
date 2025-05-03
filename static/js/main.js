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
    
    // Handle journal entry sentiment analysis
    const journalForm = document.getElementById('journalEntryForm');
    const sentimentResult = document.getElementById('sentimentResult');
    const journalTextarea = document.getElementById('journal_entry');
    
    if (journalForm && sentimentResult && journalTextarea) {
        // Analyze sentiment when typing stops
        let typingTimer;
        const doneTypingInterval = 1000;  // 1 second after typing stops
        
        journalTextarea.addEventListener('keyup', function() {
            clearTimeout(typingTimer);
            if (journalTextarea.value) {
                typingTimer = setTimeout(analyzeSentiment, doneTypingInterval);
            }
        });
        
        function analyzeSentiment() {
            const text = journalTextarea.value;
            if (text.length > 10) {  // Only analyze if there's meaningful text
                fetch('/api/analyze-sentiment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: text })
                })
                .then(response => response.json())
                .then(data => {
                    sentimentResult.textContent = `Sentiment: ${data.sentiment}`;
                    
                    // Remove all sentiment classes
                    sentimentResult.classList.remove('sentiment-positive', 'sentiment-neutral', 'sentiment-negative');
                    
                    // Add appropriate sentiment class
                    sentimentResult.classList.add(`sentiment-${data.sentiment.toLowerCase()}`);
                    
                    // Add to hidden form field if it exists
                    const sentimentField = document.getElementById('sentiment');
                    if (sentimentField) {
                        sentimentField.value = data.sentiment;
                    }
                })
                .catch(error => {
                    console.error('Error analyzing sentiment:', error);
                });
            }
        }
    }
    
    // Handle calendar functionality in journal page
    const calendarDays = document.querySelectorAll('.calendar-day');
    if (calendarDays.length > 0) {
        calendarDays.forEach(function(day) {
            day.addEventListener('click', function() {
                const date = this.dataset.date;
                window.location.href = `/journal?date=${date}`;
            });
        });
    }
    
    // Handle breathing exercise if on that page
    const breathingCircle = document.getElementById('breathingCircle');
    const breathingText = document.getElementById('breathingText');
    const startBreathingBtn = document.getElementById('startBreathing');
    
    if (breathingCircle && breathingText && startBreathingBtn) {
        startBreathingBtn.addEventListener('click', function() {
            startBreathingExercise();
        });
        
        function startBreathingExercise() {
            const phases = [
                { text: 'Inhale', duration: 4000, class: 'breathing-inhale' },
                { text: 'Hold', duration: 7000, class: 'breathing-hold' },
                { text: 'Exhale', duration: 8000, class: 'breathing-exhale' }
            ];
            
            let currentPhase = 0;
            let timer;
            
            function updatePhase() {
                // Remove all classes
                breathingCircle.classList.remove('breathing-inhale', 'breathing-hold', 'breathing-exhale');
                
                // Add current phase class
                breathingCircle.classList.add(phases[currentPhase].class);
                
                // Update text
                breathingText.textContent = phases[currentPhase].text;
                
                // Schedule next phase
                timer = setTimeout(function() {
                    currentPhase = (currentPhase + 1) % phases.length;
                    updatePhase();
                }, phases[currentPhase].duration);
            }
            
            // Start the exercise
            updatePhase();
            
            // Change button to stop button
            startBreathingBtn.textContent = 'Stop Exercise';
            startBreathingBtn.onclick = function() {
                clearTimeout(timer);
                breathingCircle.classList.remove('breathing-inhale', 'breathing-hold', 'breathing-exhale');
                breathingText.textContent = 'Ready';
                startBreathingBtn.textContent = 'Start Breathing Exercise';
                startBreathingBtn.onclick = function() {
                    startBreathingExercise();
                };
            };
        }
    }
});