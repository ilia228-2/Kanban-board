<div align="center">

# 🗂️ Kanban Board

**Клиент-серверное веб-приложение для управления проектами и задачами в формате канбан-доски**

![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.161-009688?logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.x-D71F00)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Alembic](https://img.shields.io/badge/Alembic-migrations-6BA81E)

</div>

---

## 📌 О проекте

Учебная практика, 3 курс. **Вариант 11: Канбан-доска** (сущности «Проект» и «Карточка»).

Пользователь регистрируется, входит в систему и работает **только со своими данными**: создаёт проекты, добавляет в них карточки, меняет их статус (`todo` → `in_progress` → `done`), приоритет и срок, удаляет ненужное.

| | |
|---|---|
| **Автор** | _ФИО_ |
| **Группа** | _номер группы_ |
| **Вариант** | 11. Канбан-доска |

## ✨ Возможности

- Регистрация, вход и выход, эндпоинт «кто я» (`/api/auth/me`)
- Пароли хранятся только как **bcrypt-хеш с солью**
- Сессия в подписанной cookie (`SessionMiddleware`), без JWT
- Полный CRUD для карточек, создание, список и удаление для проектов
- Колонки канбана: `todo` / `in_progress` / `done`, приоритет 1–3, срок выполнения
- Изоляция данных: чужая запись всегда отвечает `404`
- Валидация на двух уровнях: схемы Pydantic и `CHECK`-ограничения в БД
- Автодокументация API в Swagger (`/docs`)

## 🛠️ Технологии

| Часть | Что используется |
|---|---|
| Бэкенд | FastAPI, `APIRouter`, схемы Pydantic |
| База данных | PostgreSQL 16 (в Docker), SQLAlchemy 2.0 (`Mapped` / `mapped_column`, `select`) |
| Миграции | Alembic, все таблицы создаются только миграциями |
| Авторизация | `SessionMiddleware`, bcrypt |
| Фронтенд | HTML, CSS, JavaScript без фреймворков, раздаётся через `StaticFiles` |
| Инфраструктура | Docker Compose, Git |

## 🗄️ Схема базы данных

```mermaid
erDiagram
    USER ||--o{ PROJECT : "владеет"
    PROJECT ||--o{ CARD : "содержит"

    USER {
        int id PK
        varchar50 username UK
        varchar255 password_hash
        timestamptz created_at
    }
    PROJECT {
        int id PK
        int owner_id FK
        varchar200 title
        timestamptz created_at
    }
    CARD {
        int id PK
        int project_id FK
        varchar200 title
        text description
        varchar20 status
        smallint priority
        date due_date
        timestamptz created_at
    }
```

**Связи и ограничения**

- `Project.owner_id` → `User.id`, `ON DELETE CASCADE`
- `Card.project_id` → `Project.id`, `ON DELETE CASCADE`
- `Card.status` допускает только `todo`, `in_progress`, `done` (`CHECK`)
- `Card.priority` допускает значения от 1 до 3 (`CHECK`), по умолчанию 2
- `User.username` уникален
- Индексы на внешних ключах `owner_id` и `project_id`

> **Почему `project_id` лежит в `Card`, а не наоборот?** Связь «один ко многим»: у проекта много карточек, а у карточки ровно один проект. Внешний ключ хранится на стороне «многих», потому что в одной ячейке нельзя хранить список карточек.

Исходная схема, нарисованная на этапе проектирования: [`docs/db-schema.png`](docs/db-schema.png).

## 🔌 API

Все эндпоинты с данными требуют входа, иначе `401`. Интерактивная документация: **http://127.0.0.1:8000/docs**

### Авторизация

| Метод | URL | Описание | Коды ответа |
|---|---|---|---|
| `POST` | `/api/auth/register` | Регистрация, сразу выполняет вход | 201, 409, 422 |
| `POST` | `/api/auth/login` | Вход | 200, 401, 422 |
| `POST` | `/api/auth/logout` | Выход, сбрасывает сессию | 204 |
| `GET` | `/api/auth/me` | Текущий пользователь | 200, 401 |

### Проекты

| Метод | URL | Описание | Коды ответа |
|---|---|---|---|
| `POST` | `/api/projects` | Создать проект | 201, 401, 422 |
| `GET` | `/api/projects` | Список своих проектов | 200, 401 |
| `DELETE` | `/api/projects/{id}` | Удалить проект вместе с карточками | 204, 401, 404 |

### Карточки

| Метод | URL | Описание | Коды ответа |
|---|---|---|---|
| `GET` | `/api/projects/{project_id}/cards` | Список карточек проекта | 200, 401, 404 |
| `POST` | `/api/projects/{project_id}/cards` | Создать карточку | 201, 401, 404, 422 |
| `GET` | `/api/cards/{id}` | Одна карточка | 200, 401, 404 |
| `PATCH` | `/api/cards/{id}` | Частичное обновление (только переданные поля) | 200, 401, 404, 422 |
| `DELETE` | `/api/cards/{id}` | Удалить карточку | 204, 401, 404 |

**Пример: создание карточки**

```http
POST /api/projects/1/cards
Content-Type: application/json

{"title": "Сверстать главную", "priority": 3, "due_date": "2026-11-05"}
```

```json
{
  "id": 1,
  "project_id": 1,
  "title": "Сверстать главную",
  "description": null,
  "status": "todo",
  "priority": 3,
  "due_date": "2026-11-05",
  "created_at": "2026-10-28T03:51:05.972506Z"
}
```

## 🔒 Безопасность

- Пароли хранятся как bcrypt-хеш, соль входит в сам хеш, поэтому одинаковые пароли дают разные хеши
- В ответах API нет `password_hash` (схема `UserOut` содержит только `id` и `username`)
- `owner_id` берётся из сессии, а не из тела запроса
- Каждый запрос к данным фильтруется по владельцу (`Project.owner_id == user.id`), для карточек проверка идёт через `JOIN` с проектом
- Чужая или несуществующая запись даёт `404`, чтобы не раскрывать факт её существования
- Cookie сессии подписана ключом `SECRET_KEY`, подделать `user_id` без ключа нельзя

## 🚀 Установка и запуск

**Требования:** Python 3.13, Docker Desktop, Git.

```bash
# 1. Клонировать репозиторий
git clone https://github.com/ilia228-2/Kanban-board.git
cd Kanban-board

# 2. Создать и активировать виртуальное окружение
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 3. Установить зависимости
pip install -r requirements.txt

# 4. Запустить PostgreSQL в Docker
docker compose up -d

# 5. Применить миграции (создаст все таблицы)
alembic upgrade head

# 6. Запустить сервер
uvicorn app.main:app --reload
```

После запуска:

- Swagger: http://127.0.0.1:8000/docs
- Приложение: http://127.0.0.1:8000/

### Настройки

Значения по умолчанию подходят для локальной разработки. Для другого окружения задай переменные:

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://app:app@localhost:5433/kanban` | Адрес базы данных |
| `SECRET_KEY` | запасной ключ для разработки | Подпись cookie сессии. В боевом окружении обязательно задать свой длинный случайный ключ |

> PostgreSQL в контейнере слушает порт **5433** (а не 5432), чтобы не конфликтовать с локально установленным Postgres.

### Полезные команды

```bash
docker compose ps                 # статус базы
docker compose stop               # остановить базу (данные сохранятся)
docker compose down -v            # удалить базу вместе с данными
docker compose exec db psql -U app -d kanban   # консоль PostgreSQL

alembic revision --autogenerate -m "описание"  # новая миграция
alembic upgrade head                           # применить миграции
```

## 📁 Структура проекта

```
Kanban-board/
├── app/
│   ├── main.py            # сборка приложения, middleware, StaticFiles
│   ├── database.py        # engine, SessionLocal, Base, get_db
│   ├── models.py          # модели SQLAlchemy: User, Project, Card
│   ├── schemas.py         # схемы Pydantic: Create / Update / Out
│   ├── security.py        # хеширование и проверка паролей (bcrypt)
│   ├── deps.py            # зависимость get_current_user
│   └── routers/
│       ├── auth.py        # регистрация, вход, выход, /me
│       ├── projects.py    # проекты
│       └── cards.py       # карточки
├── migrations/            # миграции Alembic
├── static/                # фронтенд (HTML, CSS, JS)
├── docs/                  # схема БД
├── docker-compose.yml     # PostgreSQL 16
├── alembic.ini
├── requirements.txt
└── README.md
```

## 🧭 Статус разработки

- [x] Проектирование: схема БД, список эндпоинтов
- [x] PostgreSQL в Docker
- [x] Модели SQLAlchemy и миграция Alembic
- [x] Авторизация: регистрация, вход, выход, `/me`
- [x] API проектов и карточек с проверкой владельца
- [ ] Фронтенд: страницы входа, регистрации и главная с доской
- [ ] Скриншоты интерфейса в README

## 📸 Скриншоты

_Появятся после реализации фронтенда._

<!-- ![Главная страница](docs/screenshot-main.png) -->
<!-- ![Вход](docs/screenshot-login.png) -->

## 📝 Лицензия

Учебный проект.
