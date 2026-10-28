from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=72)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


from datetime import date, datetime
from typing import Literal


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime


class CardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: Literal["todo", "in_progress", "done"] = "todo"
    priority: int = Field(default=2, ge=1, le=3)
    due_date: date | None = None


class CardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: Literal["todo", "in_progress", "done"] | None = None
    priority: int | None = Field(default=None, ge=1, le=3)
    due_date: date | None = None


class CardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: str | None
    status: str
    priority: int
    due_date: date | None
    created_at: datetime
