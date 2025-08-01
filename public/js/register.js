document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const user_name = document.getElementById('user_name').value.trim();
  const full_name = document.getElementById('full_name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');

  modal.style.display = 'none';
  modal.className = 'modal';

  if (!user_name || !full_name || !email || !password || !confirmPassword) {
    console.error('Missing required fields:', { user_name, full_name, email, password: !!password, confirmPassword: !!confirmPassword });
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'Please provide all required fields';
    modal.className = 'modal error';
    modal.style.display = 'block';
    return;
  }

  if (password !== confirmPassword) {
    console.error('Passwords do not match');
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'Passwords do not match';
    modal.className = 'modal error';
    modal.style.display = 'block';
    return;
  }

  console.log('Register attempt:', { user_name, email });

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name, full_name, email, password, confirmPassword })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Registration successful:', data.message);
      modalTitle.textContent = 'Success';
      modalMessage.textContent = data.message;
      modal.className = 'modal success';
      modal.style.display = 'block';
      setTimeout(() => {
        modal.style.display = 'none';
        window.location.href = '/verify-email';
      }, 2000);
    } else {
      console.error('Registration failed:', data.message);
      modalTitle.textContent = 'Error';
      modalMessage.textContent = data.message || 'Registration failed';
      modal.className = 'modal error';
      modal.style.display = 'block';
    }
  } catch (error) {
    console.error('Error during registration:', {
      message: error.message,
      stack: error.stack
    });
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'An error occurred while registering. Please try again.';
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

document.getElementById('toggleConfirmPassword').addEventListener('click', () => {
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const toggleIcon = document.getElementById('toggleConfirmPassword');
  if (confirmPasswordInput.type === 'password') {
    confirmPasswordInput.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  } else {
    confirmPasswordInput.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  }
});

// Close modal
document.querySelector('.modal-close').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});