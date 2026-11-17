function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTaskCards(grid, tasks, emptyText) {
  if (!tasks.length) {
    grid.innerHTML = `<p style="color:var(--muted);">${emptyText}</p>`;
    return;
  }

  grid.innerHTML = tasks.map(t => `
    <article class="task-card" onclick="location.href='/task.html?id=${t.id}'" style="cursor: pointer;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:.5rem;">
        <h3 style="margin-top:0;">${escapeHtml(t.title)}</h3>
        <span class="badge-status ${t.status}">${t.status}</span>
      </div>
      <div class="task-meta" style="margin-bottom:8px;">
        <span class="badge-priority ${t.priority}">${t.priority}</span>
        <span>📁 ${escapeHtml(t.project_title)}</span>
        ${t.assignee_name ? `<span>👤 ${escapeHtml(t.assignee_name)}</span>` : ''}
        ${t.due_date ? `<span>📅 ${t.due_date}</span>` : ''}
      </div>
      ${t.description ? `<p style="font-size:.85rem; color:var(--muted); margin:0;">${escapeHtml(t.description.slice(0, 120))}${t.description.length > 120 ? '...' : ''}</p>` : ''}
    </article>
  `).join('');
}

// Глобальная функция для dashboard.html
async function renderTasks() {
  if (window.currentUser) {
    const user = await window.currentUser;
    if (user && user.role === 'admin') {
      const adminLink = document.getElementById('adminLink');
      if (adminLink) adminLink.style.display = 'block';
    }
  }

  const grid = document.getElementById('tasksGrid');
  if (!grid) return;

  const res = await fetch('/api/tasks', { credentials: 'include' });
  if (!res.ok) return;

  const tasks = await res.json();
  renderTaskCards(grid, tasks, 'Задач пока нет. Создайте первую!');

  // Отрисовка статистики на dashboard.html (если блок #stats есть на странице)
  const statsEl = document.getElementById('stats');
  if (statsEl) {
    const stats = { todo: 0, in_progress: 0, review: 0, done: 0 };
    tasks.forEach(t => { if (stats[t.status] !== undefined) stats[t.status]++; });
    statsEl.innerHTML = `
      <div class="stat-card" style="background:#fff;padding:1rem;border-radius:10px;border:1px solid #e2e8f0;">
        <div style="font-size:1.5rem;font-weight:700;">${tasks.length}</div>
        <div style="color:var(--muted);font-size:.85rem;">Всего задач</div>
      </div>
      <div class="stat-card" style="background:#fff;padding:1rem;border-radius:10px;border:1px solid #e2e8f0;">
        <div style="font-size:1.5rem;font-weight:700;">${stats.todo}</div>
        <div style="color:var(--muted);font-size:.85rem;">To Do</div>
      </div>
      <div class="stat-card" style="background:#fff;padding:1rem;border-radius:10px;border:1px solid #e2e8f0;">
        <div style="font-size:1.5rem;font-weight:700;">${stats.in_progress}</div>
        <div style="color:var(--muted);font-size:.85rem;">В работе</div>
      </div>
      <div class="stat-card" style="background:#fff;padding:1rem;border-radius:10px;border:1px solid #e2e8f0;">
        <div style="font-size:1.5rem;font-weight:700;">${stats.done}</div>
        <div style="color:var(--muted);font-size:.85rem;">Готово</div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.currentUser;
  if (!user) return;

  if (user.role === 'admin') {
    const adminLink = document.getElementById('adminLink');
    if (adminLink) adminLink.style.display = 'block';
  }

  const filterForm = document.getElementById('filterForm');

  // Если на странице НЕТ формы фильтров (значит это dashboard.html) — запускаем обычный renderTasks()
  if (!filterForm) {
    await renderTasks();
    return;
  }

  // Иначе это страница tasks.html с поиском и фильтрами
  const searchInput    = document.getElementById('searchInput');
  const statusFilter   = document.getElementById('statusFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const assigneeFilter = document.getElementById('assigneeFilter');
  const resetBtn       = document.getElementById('resetFiltersBtn');
  const grid           = document.getElementById('tasksGrid');

  async function loadAssignees() {
    try {
      const res = await fetch('/api/tasks/assignees', { credentials: 'include' });
      if (!res.ok) return;
      const users = await res.json();

      users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.username;
        assigneeFilter.appendChild(opt);
      });
    } catch (err) {
      console.error('Ошибка загрузки исполнителей:', err);
    }
  }

  function syncFormWithUrl() {
    const params = new URLSearchParams(window.location.search);
    searchInput.value    = params.get('q') || '';
    statusFilter.value   = params.get('status') || '';
    priorityFilter.value = params.get('priority') || '';
    assigneeFilter.value = params.get('assignee_id') || '';
  }

  async function fetchAndRenderTasks() {
    const params = new URLSearchParams();

    if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
    if (statusFilter.value)       params.set('status', statusFilter.value);
    if (priorityFilter.value)     params.set('priority', priorityFilter.value);
    if (assigneeFilter.value)     params.set('assignee_id', assigneeFilter.value);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);

    try {
      const res = await fetch(`/api/tasks?${queryString}`, { credentials: 'include' });
      if (!res.ok) {
        grid.innerHTML = `<p style="color:red;">Ошибка загрузки задач.</p>`;
        return;
      }

      const tasks = await res.json();
      renderTaskCards(grid, tasks, 'Задачи по заданным критериям не найдены.');
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<p style="color:red;">Ошибка соединения с сервером.</p>`;
    }
  }

  filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchAndRenderTasks();
  });

  statusFilter.addEventListener('change', fetchAndRenderTasks);
  priorityFilter.addEventListener('change', fetchAndRenderTasks);
  assigneeFilter.addEventListener('change', fetchAndRenderTasks);

  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchAndRenderTasks, 300);
  });

  resetBtn.addEventListener('click', () => {
    filterForm.reset();
    fetchAndRenderTasks();
  });

  await loadAssignees();
  syncFormWithUrl();
  await fetchAndRenderTasks();
});
