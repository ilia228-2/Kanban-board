from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Card, Project, User
from app.schemas import CardCreate, CardOut, CardUpdate

router = APIRouter(prefix="/api", tags=["cards"])


def get_own_project(db: Session, project_id: int, user: User) -> Project:
    project = db.scalar(
        select(Project).where(Project.id == project_id, Project.owner_id == user.id)
    )
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


def get_own_card(db: Session, card_id: int, user: User) -> Card:
    card = db.scalar(
        select(Card)
        .join(Project, Card.project_id == Project.id)
        .where(Card.id == card_id, Project.owner_id == user.id)
    )
    if card is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Card not found")
    return card


@router.get("/projects/{project_id}/cards", response_model=list[CardOut])
def list_cards(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_own_project(db, project_id, user)
    stmt = select(Card).where(Card.project_id == project_id).order_by(Card.id)
    return db.scalars(stmt).all()


@router.post(
    "/projects/{project_id}/cards",
    response_model=CardOut,
    status_code=status.HTTP_201_CREATED,
)
def create_card(
    project_id: int,
    data: CardCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_own_project(db, project_id, user)
    card = Card(project_id=project_id, **data.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.get("/cards/{card_id}", response_model=CardOut)
def get_card(
    card_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_own_card(db, card_id, user)


@router.patch("/cards/{card_id}", response_model=CardOut)
def update_card(
    card_id: int,
    data: CardUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = get_own_card(db, card_id, user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = get_own_card(db, card_id, user)
    db.delete(card)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
