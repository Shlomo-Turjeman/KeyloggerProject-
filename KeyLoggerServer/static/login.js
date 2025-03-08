document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const messageElement = document.getElementById('message');
    const togglePassword = document.getElementById('togglePassword');

    // Focus on username input on page load
    usernameInput.focus();

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle icon
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    // Form submission
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Logging in...';
        submitButton.disabled = true;

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Validate inputs
        if (!username || !password) {
            messageElement.textContent = 'Please enter both username and password.';

            // Reset button
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Success - animate transition
                messageElement.textContent = data.msg || 'Login successful. Redirecting...';
                messageElement.style.color = 'var(--success)';

                // Redirect with slight delay for better UX
                setTimeout(() => {
                    window.location.href = '/';
                }, 800);
            } else {
                // Error
                messageElement.textContent = data.msg || 'Login failed. Please check your credentials.';

                // Shake animation for failed login
                loginForm.classList.add('shake');
                setTimeout(() => {
                    loginForm.classList.remove('shake');
                }, 500);

                // Reset button
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;

                // Focus on password field for retry
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            messageElement.textContent = 'Connection error. Please try again later.';
            console.error('Login error:', error);

            // Reset button
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    });

    // Add shake animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
    `;
    document.head.appendChild(style);
});