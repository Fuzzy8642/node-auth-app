async function loadCurrentUser() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    
    // ВЫВОДИМ СТАТУС В КОНСОЛЬ
    console.log("Статус /me:", res.status); 
    
    if (!res.ok) { 
      console.log("Ошибка сессии, редирект на вход");
      window.location.href = '/index.html'; 
      return null; 
    }
    
    const user = await res.json();
    console.log("Данные юзера:", user); // ВЫВОДИМ ЮЗЕРА

    // Заполняем имя
    const userInfoElements = document.querySelectorAll('#userInfo');
    userInfoElements.forEach(el => {
      el.innerHTML = `<strong style="color:#fff;">${user.username}</strong><br>
                      <span style="color:#94a3b8; font-size:.8rem;">${user.role}</span>`;
    });
    
    return user;
  } catch (err) {
    console.error("Критическая ошибка:", err);
    window.location.href = '/index.html';
    return null;
  }
}

// ... остальной код (кнопка выхода) ...

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/index.html';
  });
}

window.currentUser = loadCurrentUser();