async function renderProjects() {
  await window.currentUser;
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/projects', { credentials: 'include' });
    if (!res.ok) return;
    
    const projects = await res.json();
    
    if (!projects.length) {
      grid.innerHTML = `<p style="color:var(--muted);">Проектов пока нет.</p>`;
      return;
    }

    grid.innerHTML = projects.map(p => `
      <article class="task-card" style="cursor: default;">
        <h3 style="margin-top:0; color: #1e293b;">📁 ${p.title}</h3>
        <p style="font-size: .9rem; color: var(--muted); margin-bottom: 10px;">
          ${p.description || 'Описание отсутствует'}
        </p>
        <div style="font-size: .8rem; color: #94a3b8;">
          Владелец: ${p.owner_name}
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

renderProjects();