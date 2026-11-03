const FIELD_NAMES = {
  username: 'логин',
  password: 'пароль',
  title: 'название',
};

const MESSAGES = {
  'Invalid username or password': 'Неверный логин или пароль',
  'Username already taken': 'Такой логин уже занят',
  'Not authenticated': 'Нужно войти',
  'Project not found': 'Проект не найден',
  'Card not found': 'Карточка не найдена',
};

function errorText(data, status) {
  if (data && typeof data.detail === 'string') {
    return MESSAGES[data.detail] || data.detail;
  }
  if (data && Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        const field = item.loc[item.loc.length - 1];
        const name = FIELD_NAMES[field] || field;
        if (item.type === 'string_too_short') {
          return 'Поле «' + name + '»: минимум ' + item.ctx.min_length + ' симв.';
        }
        if (item.type === 'string_too_long') {
          return 'Поле «' + name + '»: максимум ' + item.ctx.max_length + ' симв.';
        }
        return 'Поле «' + name + '»: ' + item.msg;
      })
      .join('. ');
  }
  return 'Ошибка ' + status;
}

async function api(method, url, body) {
  const options = { method: method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (response.status === 204) {
    return null;
  }
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }
  if (!response.ok) {
    throw { status: response.status, message: errorText(data, response.status) };
  }
  return data;
}
