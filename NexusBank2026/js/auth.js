// ============================================
// auth.js - Login & Authentication Specific
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize login-specific features only on login page
    if (document.getElementById('loginForm')) {
        initLogin();
        initForgotPassword();
    }
});

// ============================================
// LOGIN – AUTHENTICATION & REMEMBER ME
// ============================================
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const rememberCheck = document.querySelector('#loginForm .checkbox input[type="checkbox"]');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loginError = document.getElementById('loginError');

    // Clear any existing error messages on input
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            if (loginError) loginError.style.display = 'none';
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            if (loginError) loginError.style.display = 'none';
        });
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Basic validation
        if (!email || !password) {
            if (loginError) {
                loginError.textContent = 'Please enter both email and password.';
                loginError.style.display = 'flex';
            } else {
                alert('Please enter email and password.');
            }
            return;
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (loginError) {
                loginError.textContent = 'Please enter a valid email address.';
                loginError.style.display = 'flex';
            } else {
                alert('Please enter a valid email address.');
            }
            return;
        }

        // Show loading overlay
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Simulate API call
        setTimeout(() => {
            const users = JSON.parse(localStorage.getItem('nexusbank_users')) || [];
            const user = users.find(u => u.email === email && atob(u.password) === password);

            if (user) {
                // Create session
                const session = {
                    id: user.id,
                    name: user.fullName,
                    email: user.email,
                    loginTime: new Date().toISOString()
                };

                // Save session based on "Remember Me" checkbox
                if (rememberCheck && rememberCheck.checked) {
                    // Persistent session (localStorage) - survives browser restart
                    localStorage.setItem('nexusbank_current_user', JSON.stringify(session));
                    sessionStorage.removeItem('nexusbank_current_user');
                } else {
                    // Session-only (sessionStorage) – cleared when browser closed
                    sessionStorage.setItem('nexusbank_current_user', JSON.stringify(session));
                    localStorage.removeItem('nexusbank_current_user');
                }

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Hide loading overlay
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                
                // Show error message
                if (loginError) {
                    loginError.textContent = 'Invalid email or password. Please try again.';
                    loginError.style.display = 'flex';
                } else {
                    alert('Invalid email or password.');
                }
                
                // Shake animation for form on error
                loginForm.classList.add('shake');
                setTimeout(() => {
                    loginForm.classList.remove('shake');
                }, 500);
            }
        }, 1500);
    });

    // Optional: Add "Show/Hide Password" toggle for login page
    const togglePasswordBtn = document.querySelector('#loginForm .toggle-password');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}

// ============================================
// FORGOT PASSWORD – SIMULATION
// ============================================
function initForgotPassword() {
    const forgotLink = document.querySelector('.forgot-link');
    if (!forgotLink) return;

    forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Create a modal dialog instead of prompt for better UX
        const email = prompt('Enter your email address to reset your password:');
        
        if (email) {
            if (email.includes('@') && email.includes('.')) {
                // Check if email exists in our "database"
                const users = JSON.parse(localStorage.getItem('nexusbank_users')) || [];
                const userExists = users.some(u => u.email === email);
                
                if (userExists) {
                    // Generate a reset token and store (demo)
                    const token = Math.random().toString(36).substr(2, 10);
                    const resetRequests = JSON.parse(localStorage.getItem('nexusbank_reset_tokens')) || [];
                    
                    // Remove any existing tokens for this email
                    const filteredRequests = resetRequests.filter(req => req.email !== email);
                    
                    // Add new token
                    filteredRequests.push({ 
                        email, 
                        token, 
                        expires: Date.now() + 3600000 // 1 hour
                    });
                    
                    localStorage.setItem('nexusbank_reset_tokens', JSON.stringify(filteredRequests));
                    
                    // In a real app, you'd send an email here
                    alert(`✅ Password reset link sent to ${email}\n\nDemo Token: ${token}\n\n(In a real app, this would be sent via email)`);
                } else {
                    alert('❌ No account found with this email address.');
                }
            } else {
                alert('❌ Please enter a valid email address.');
            }
        }
    });
}

// ============================================
// CHECK IF USER IS ALREADY LOGGED IN
// ============================================
(function checkLoggedIn() {
    // Only run on login page
    if (window.location.pathname.includes('login.html')) {
        const user = JSON.parse(localStorage.getItem('nexusbank_current_user')) ||
                     JSON.parse(sessionStorage.getItem('nexusbank_current_user'));
        
        // If user is already logged in, redirect to dashboard
        if (user) {
            window.location.href = 'dashboard.html';
        }
    }
})();

// Add CSS animation for form shake
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    .shake {
        animation: shake 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);