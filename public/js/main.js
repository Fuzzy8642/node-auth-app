// Обработка формы входа
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include' 
    });

    const data = await res.json();
    
    if (res.ok) {
      // Если сервер сказал, куда идти, идем туда
      window.location.href = data.redirect;
    } else {
      alert(data.error);
    }
  } catch (err) {
    alert('Ошибка сети: ' + err.message);
  }
});

// Обработка формы регистрации
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include' 
    });

    const data = await res.json();
    if (res.ok) {
      alert('Регистрация успешна! Теперь войдите.');
      window.location.href = '/index.html';
    } else {
      alert(data.error);
    }
  } catch (err) {
    alert('Ошибка сети: ' + err.message);
  }
});