const form = document.getElementById('auth-form');
const errorBox = document.getElementById('error');
const button = form.querySelector('button');
const mode = form.dataset.mode;
const buttonText = button.textContent;

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  errorBox.hidden = true;
  button.disabled = true;
  button.textContent = 'Подождите...';

  const body = {
    username: form.username.value.trim(),
    password: form.password.value,
  };

  try {
    await api('POST', '/api/auth/' + mode, body);
    window.location.href = '/index.html';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
    button.disabled = false;
    button.textContent = buttonText;
  }
});
