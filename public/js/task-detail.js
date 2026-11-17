const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done'
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadTask() {
  const user = await window.currentUser;
  if (!user) return;

  if (user.role === 'admin') {
    const adminLink = document.getElementById('adminLink');
    if (adminLink) adminLink.style.display = 'block';
  }

  const params = new URLSearchParams(window.location.search);
  const taskId = params.get('id');
  const container = document.getElementById('taskContainer');

  if (!taskId) {
    container.innerHTML = `<p style="color: red;">Ошибка: ID задачи не указан.</p>`;
    return;
  }

  try {
    const res = await fetch(`/api/tasks/${taskId}`, { credentials: 'include' });
    if (!res.ok) {
      container.innerHTML = `<p style="color: red;">Задача не найдена или нет доступа.</p>`;
      return;
    }

    const task = await res.json();

    // Проверка прав на смену статуса
    const canEditAny = ['manager', 'admin'].includes(user.role);
    const isOwnTask  = task.author_id === user.id || task.assignee_id === user.id;
    const canChangeStatus = canEditAny || (user.role === 'user' && isOwnTask);

    // Блок управления статусом (выпадающий список + кнопка только при наличии прав)
    const statusControlHtml = canChangeStatus
      ? `
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span id="statusBadge" class="badge-status ${task.status}">${STATUS_LABELS[task.status] || task.status}</span>
          <select id="statusSelect" style="padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; background: #fff;">
            ${Object.entries(STATUS_LABELS).map(([val, label]) =>
              `<option value="${val}" ${task.status === val ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>
          <button type="button" id="saveStatusBtn" class="btn btn-primary" style="padding: 6px 12px; font-size: 14px;">
            Сохранить
          </button>
          <span id="statusMsg" style="font-size: 13px; color: #16a34a; display: none;">✓ Сохранено</span>
        </div>
      `
      : `<span class="badge-status ${task.status}">${STATUS_LABELS[task.status] || task.status}</span>`;

    // Проверка прав на комментарии
    const canComment = ['user', 'manager', 'admin'].includes(user.role);
    const commentFormHtml = canComment
      ? `
        <form id="commentForm" style="margin-bottom: 20px;">
          <div style="margin-bottom: 10px;">
            <textarea id="commentBody" rows="3" placeholder="Напишите комментарий..." required
              style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; resize: vertical;"></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Отправить комментарий</button>
        </form>
      `
      : `
        <p style="color: var(--muted); font-size: 14px; background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
          Ваша роль (<strong>viewer</strong>) позволяет только просматривать информацию. Оставлять комментарии могут пользователи с ролью <strong>user</strong> и выше.
        </p>
      `;

    container.innerHTML = `
      <div class="task-detail">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
          <h1 style="margin-top: 0; margin-bottom: 8px;">${escapeHtml(task.title)}</h1>
          ${statusControlHtml}
        </div>
        
        <p style="color: var(--muted); font-size: 15px; margin-bottom: 24px;">
          ${escapeHtml(task.description) || 'Описание отсутствует'}
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <div class="detail-row">
            <div class="detail-label">Проект</div>
            <div class="detail-value">📁 ${escapeHtml(task.project_title)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Приоритет</div>
            <div class="detail-value"><span class="badge-priority ${task.priority}">${task.priority}</span></div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Автор</div>
            <div class="detail-value">👤 ${escapeHtml(task.author_name)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Исполнитель</div>
            <div class="detail-value">👤 ${escapeHtml(task.assignee_name) || 'Не назначен'}</div>
          </div>
        </div>
      </div>

      <div class="comments-section">
        <h3>Комментарии</h3>
        ${commentFormHtml}
        <div id="commentsList">Загрузка...</div>
      </div>
    `;

    // Обработчик сохранения нового статуса
    const saveStatusBtn = document.getElementById('saveStatusBtn');
    if (saveStatusBtn) {
      saveStatusBtn.addEventListener('click', async () => {
        const select = document.getElementById('statusSelect');
        const badge  = document.getElementById('statusBadge');
        const msg    = document.getElementById('statusMsg');
        const newStatus = select.value;

        saveStatusBtn.disabled = true;
        try {
          const putRes = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'include'
          });

          if (putRes.ok) {
            badge.className = `badge-status ${newStatus}`;
            badge.textContent = STATUS_LABELS[newStatus] || newStatus;
            msg.style.display = 'inline';
            setTimeout(() => { msg.style.display = 'none'; }, 2000);
          } else {
            const err = await putRes.json();
            alert('Ошибка: ' + (err.error || 'Не удалось обновить статус'));
          }
        } catch (err) {
          alert('Ошибка сети при обновлении статуса');
        } finally {
          saveStatusBtn.disabled = false;
        }
      });
    }

    // Обработчик отправки комментария
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textarea = document.getElementById('commentBody');
        const body = textarea.value.trim();
        if (!body) return;

        const submitBtn = commentForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
          const postRes = await fetch(`/api/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body }),
            credentials: 'include'
          });

          if (postRes.ok) {
            textarea.value = '';
            await loadComments(taskId);
          } else {
            const err = await postRes.json();
            alert('Ошибка: ' + (err.error || 'Не удалось отправить комментарий'));
          }
        } catch (err) {
          alert('Ошибка сети при отправке комментария');
        } finally {
          submitBtn.disabled = false;
        }
      });
    }

    await loadComments(taskId);

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color: red;">Ошибка сервера.</p>`;
  }
}

async function loadComments(taskId) {
  const list = document.getElementById('commentsList');
  const res = await fetch(`/api/tasks/${taskId}/comments`, { credentials: 'include' });
  if (!res.ok) {
    list.innerHTML = `<p style="color: var(--muted);">Не удалось загрузить комментарии.</p>`;
    return;
  }

  const comments = await res.json();
  if (!comments.length) {
    list.innerHTML = `<p style="color: var(--muted); font-size: 14px;">Комментариев пока нет.</p>`;
  } else {
    list.innerHTML = comments.map(c => `
      <div class="comment">
        <span class="comment-date">${new Date(c.created_at).toLocaleString()}</span>
        <div class="comment-author">👤 ${escapeHtml(c.username)}</div>
        <div style="font-size: 14px; white-space: pre-wrap;">${escapeHtml(c.body)}</div>
      </div>
    `).join('');
  }
}

loadTask();
