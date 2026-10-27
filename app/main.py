import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.routers import auth

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "dev-only-change-me-7f3a9c1e5b8d4a62b0c9e1f7d3a5b8c2",
)

app = FastAPI(title="Kanban")
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY, same_site="lax")

app.include_router(auth.router)

app.mount("/", StaticFiles(directory="static", html=True), name="static")
