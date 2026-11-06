const COLUMNS = [
  { status: 'todo', title: 'К работе' },
  { status: 'in_progress', title: 'В процессе' },
  { status: 'done', title: 'Готово' },
];

const PRIORITIES = {
  1: 'Низкий',
  2: 'Средний',
  3: 'Высокий',
};

const projectsList = document.getElementById('projects-list');
const projectsState = document.getElementById('projects-state');
const projectForm = document.getElementById('project-form');
const projectTitle = document.getElementById('project-title');
const boardTitle = document.getElementById('board-title');
const boardState = document.getElementById('board-state');
const board = document.getElementById('board');
const toast = document.getElementById('toast');

let projects = [];
let currentId = null;
let toastTimer = null;

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}

function handleError(err) {
  if (err && err.status === 401) {
    window.location.href = '/login.html';
    return;
  }
  showToast(err && err.message ? err.message : 'Не удалось выполнить запрос');
}

function formatDate(value) {
  const parts = value.split('-');
  return parts[2] + '.' + parts[1] + '.' + parts[0];
}

/* ---------- Проекты ---------- */

function renderProjects() {
  projectsList.replaceChildren();

  projects.forEach((project) => {
    const item = document.createElement('li');
    item.className = 'project-item';
    if (project.id === currentId) {
      item.classList.add('active');
    }

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'project-open';
    open.textContent = project.title;
    open.addEventListener('click', () => selectProject(project.id));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'project-delete';
    remove.textContent = '×';
    remove.title = 'Удалить проект';
    remove.setAttribute('aria-label', 'Удалить проект');
    remove.addEventListener('click', () => deleteProject(project));

    item.append(open, remove);
    projectsList.append(item);
  });
}

async function loadProjects() {
  projectsState.textContent = 'Загрузка...';
  projectsState.hidden = false;
  try {
    projects = await api('GET', '/api/projects');
  } catch (err) {
    projectsState.textContent = 'Не удалось загрузить проекты';
    handleError(err);
    return;
  }

  if (projects.length === 0) {
    projectsState.textContent = 'Проектов пока нет. Создайте первый.';
    projectsState.hidden = false;
    currentId = null;
    renderProjects();
    showEmptyBoard();
    return;
  }

  projectsState.hidden = true;
  const exists = projects.some((p) => p.id === currentId);
  if (!exists) {
    currentId = projects[0].id;
  }
  renderProjects();
  loadCards();
}

async function createProject(title) {
  try {
    const project = await api('POST', '/api/projects', { title: title });
    currentId = project.id;
    projectTitle.value = '';
    await loadProjects();
  } catch (err) {
    handleError(err);
  }
}

async function deleteProject(project) {
  const ok = confirm('Удалить проект «' + project.title + '» вместе со всеми карточками?');
  if (!ok) {
    return;
  }
  try {
    await api('DELETE', '/api/projects/' + project.id);
    if (currentId === project.id) {
      currentId = null;
    }
    await loadProjects();
  } catch (err) {
    handleError(err);
  }
}

function selectProject(id) {
  currentId = id;
  renderProjects();
  loadCards();
}

/* ---------- Доска ---------- */

function showEmptyBoard() {
  boardTitle.textContent = 'Доска';
  board.replaceChildren();
  boardState.textContent = 'Выберите проект или создайте новый.';
  boardState.hidden = false;
}

async function loadCards() {
  const id = currentId;
  const project = projects.find((p) => p.id === id);
  boardTitle.textContent = project ? project.title : 'Доска';

  board.replaceChildren();
  boardState.textContent = 'Загрузка карточек...';
  boardState.hidden = false;

  let cards;
  try {
    cards = await api('GET', '/api/projects/' + id + '/cards');
  } catch (err) {
    if (id === currentId) {
      boardState.textContent = 'Не удалось загрузить карточки';
    }
    handleError(err);
    return;
  }

  if (id !== currentId) {
    return;
  }
  boardState.hidden = true;
  renderBoard(cards);
}

function renderBoard(cards) {
  board.replaceChildren();

  COLUMNS.forEach((column) => {
    const columnCards = cards.filter((card) => card.status === column.status);

    const box = document.createElement('div');
    box.className = 'column column-' + column.status;

    const head = document.createElement('div');
    head.className = 'column-head';

    const title = document.createElement('h3');
    title.textContent = column.title;

    const count = document.createElement('span');
    count.className = 'column-count';
    count.textContent = columnCards.length;

    head.append(title, count);
    box.append(head);

    const list = document.createElement('div');
    list.className = 'column-cards';

    if (columnCards.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'column-empty';
      empty.textContent = 'Пусто';
      list.append(empty);
    }

    columnCards.forEach((card) => list.append(buildCard(card)));
    box.append(list);
    board.append(box);
  });
}

function buildCard(card) {
  const item = document.createElement('article');
  item.className = 'card-item';

  const title = document.createElement('h4');
  title.textContent = card.title;
  item.append(title);

  if (card.description) {
    const description = document.createElement('p');
    description.className = 'card-description';
    description.textContent = card.description;
    item.append(description);
  }

  const meta = document.createElement('div');
  meta.className = 'card-meta';

  const priority = document.createElement('span');
  priority.className = 'badge badge-p' + card.priority;
  priority.textContent = PRIORITIES[card.priority] || 'Приоритет ' + card.priority;
  meta.append(priority);

  if (card.due_date) {
    const due = document.createElement('span');
    due.className = 'card-due';
    due.textContent = 'до ' + formatDate(card.due_date);
    meta.append(due);
  }

  item.append(meta);
  return item;
}

/* ---------- Запуск ---------- */

projectForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = projectTitle.value.trim();
  if (title) {
    createProject(title);
  }
});

document.getElementById('logout').addEventListener('click', async () => {
  try {
    await api('POST', '/api/auth/logout');
  } catch (err) {
    // даже при ошибке уходим на страницу входа
  }
  window.location.href = '/login.html';
});

async function init() {
  try {
    const user = await api('GET', '/api/auth/me');
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-avatar').textContent = user.username.charAt(0).toUpperCase();
  } catch (err) {
    window.location.href = '/login.html';
    return;
  }
  loadProjects();
}

init();
