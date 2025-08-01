document.getElementById('verifyForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const verificationCode = document.getElementById('code').value.trim();
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');

  modal.style.display = 'none';
  modal.className = 'modal';

  if (!/^\d{6}$/.test(verificationCode)) {
    console.error('Invalid verification code:', verificationCode);
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'Please enter a valid 6-digit verification code';
    modal.className = 'modal error';
    modal.style.display = 'block';
    return;
  }

  console.log('Verification attempt:', { verificationCode });

  try {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationCode })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Verification successful:', data.message);
      modalTitle.textContent = 'Success';
      modalMessage.textContent = data.message;
      modal.className = 'modal success';
      modal.style.display = 'block';
      setTimeout(() => {
        modal.style.display = 'none';
        window.location.href = '/';
      }, 2000);
    } else {
      console.error('Verification failed:', data.message);
      modalTitle.textContent = 'Error';
      modalMessage.textContent = data.message;
      modal.className = 'modal error';
      modal.style.display = 'block';
    }
  } catch (error) {
    console.error('Error during verification:', {
      message: error.message,
      stack: error.stack
    });
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'An error occurred while verifying your email. Please try again.';
    modal.className = 'modal error';
    modal.style.display = 'block';
  }
});

document.getElementById('resendCode').addEventListener('click', async () => {
  const email = prompt('Please enter your email to resend the verification code:');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');

  modal.style.display = 'none';
  modal.className = 'modal';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Invalid email for resend:', email);
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'Please enter a valid email address';
    modal.className = 'modal error';
    modal.style.display = 'block';
    return;
  }

  console.log('Resend verification code attempt:', { email });

  try {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Resend successful:', data.message);
      modalTitle.textContent = 'Success';
      modalMessage.textContent = data.message;
      modal.className = 'modal success';
      modal.style.display = 'block';
      startTimer();
    } else {
      console.error('Resend failed:', data.message);
      modalTitle.textContent = 'Error';
      modalMessage.textContent = data.message || 'Failed to resend verification code';
      modal.className = 'modal error';
      modal.style.display = 'block';
    }
  } catch (error) {
    console.error('Error during resend:', {
      message: error.message,
      stack: error.stack
    });
    modalTitle.textContent = 'Error';
    modalMessage.textContent = 'Failed to resend verification code. Please try again.';
    modal.className = 'modal error';
    modal.style.display = 'block';
  }
});

// Countdown timer
function startTimer() {
  const timerDiv = document.getElementById('timer');
  const submitBtn = document.getElementById('submitBtn');
  let timeLeft = 10 * 60; // 10 minutes in seconds

  const timer = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timer);
      timerDiv.textContent = 'Code has expired. Please resend the code.';
      submitBtn.disabled = true;
    } else {
      const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const seconds = (timeLeft % 60).toString().padStart(2, '0');
      timerDiv.textContent = `Code expires in ${minutes}:${seconds}`;
      timeLeft--;
    }
  }, 1000);
}

// Start the timer when the page loads
startTimer();

// Close modal
document.querySelector('.modal-close').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});