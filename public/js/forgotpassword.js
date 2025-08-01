document.getElementById('forgotpassword-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await sendResetCode();
});

document.getElementById('resendCode').addEventListener('click', async () => {
  await sendResetCode();
});

async function sendResetCode() {
  const email = document.getElementById('email').value.trim();
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');

  modal.style.display = 'none';
  modal.className = 'modal';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Invalid email:', email);
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'Please enter a valid email address';
    modal.className = 'modal error';
    modal.style.display = 'block';
    return;
  }

  console.log('Forgot password attempt:', { email });

  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    console.log('Server response:', data);

    if (data.success) {
      console.log('Reset code request successful:', data.message);
      modalTitle.textContent = 'Success';
      modalMessage.textContent = data.message;
      modal.className = 'modal success';
      modal.style.display = 'block';
      setTimeout(() => {
        modal.style.display = 'none';
        window.location.href = '/resetpassword';
      }, 2000);
    } else {
      console.error('Reset code request failed:', data.message);
      modalTitle.textContent = 'Error';
      modalMessage.textContent = data.message || 'Failed to send reset code';
      modal.className = 'modal error';
      modal.style.display = 'block';
    }
  } catch (error) {
    console.error('Error during reset code request:', {
      message: error.message,
      stack: error.stack
    });
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'Failed to send reset code. Please try again.';
    modal.className = 'modal error';
    modal.style.display = 'block';
  }
}

// Close modal
document.querySelector('.modal-close').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});