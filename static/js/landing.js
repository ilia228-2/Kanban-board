fetch('/api/auth/me')
  .then((response) => {
    if (response.ok) {
      document.body.classList.add('is-auth');
    }
  })
  .catch(() => {});
