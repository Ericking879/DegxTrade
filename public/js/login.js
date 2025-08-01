// C:\Degx\public\js\login.js
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');

  // Reset modal
  modal.style.display = 'none';
  modal.className = 'modal';

  if (!email || !password) {
    console.error('Missing required fields:', { email, password: !!password });
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'Please provide email and password';
    modal.className = 'modal error';
    modal.style.display = 'block';
    return;
  }

  console.log('Login attempt:', { email });

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log('Login response:', data);

    if (data.success && data.token) {
      console.log('Login successful, storing token:', data.token.substring(0, 20) + '...');
      localStorage.setItem('token', data.token); // Store token in localStorage
      modalTitle.textContent = 'Success';
      modalMessage.textContent = 'Login successful! Redirecting...';
      modal.className = 'modal success';
      modal.style.display = 'block';
      setTimeout(() => {
        modal.style.display = 'none';
        window.location.href = '/dashboard';
      }, 2000);
    } else {
      console.error('Login failed:', data.message);
      modalTitle.textContent = 'Error';
      modalMessage.textContent = data.message || 'Login failed';
      modal.className = 'modal error';
      modal.style.display = 'block';
    }
  } catch (error) {
    console.error('Error during login:', {
      message: error.message,
      stack: error.stack
    });
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'An error occurred while logging in. Please try again.';
    modal.className = 'modal error';
    modal.style.display = 'block';
  }
});

// Toggle password visibility
document.getElementById('togglePassword').addEventListener('click', () => {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.getElementById('togglePassword');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  }
});

// Close modal
document.querySelector('.modal-close').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});