from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_admin
from app.db.session import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientResponse

router = APIRouter()


@router.post("/", response_model=ClientResponse)
async def create_client(
    client_data: ClientCreate,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ClientResponse:
    """Create a new client for the current user's organization."""

    # Create client linked to current user's organization
    client = Client(
        full_name=client_data.full_name,
        email=client_data.email,
        cnpj=client_data.cnpj,
        address=client_data.address,
        phone=client_data.phone,
        organization_id=current_user.organization_id
    )

    db.add(client)
    await db.commit()
    await db.refresh(client)

    return ClientResponse.from_orm(client)


@router.get("/", response_model=List[ClientResponse])
async def get_clients(
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> List[ClientResponse]:
    """Get all clients for the current user's organization."""

    # Get only clients from current user's organization (data isolation)
    result = await db.execute(
        select(Client).where(Client.organization_id == current_user.organization_id)
    )
    clients = result.scalars().all()

    return [ClientResponse.from_orm(client) for client in clients]


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client_data: ClientCreate,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
) -> ClientResponse:
    """Update a client (only if it belongs to current user's organization)."""

    # Get client to update
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.organization_id == current_user.organization_id
        )
    )
    client = result.scalar_one_or_none()

    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")

    # Update fields if provided
    update_data = client_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:  # Only update non-None values
            setattr(client, field, value)

    db.add(client)
    await db.commit()
    await db.refresh(client)

    return ClientResponse.from_orm(client)


@router.delete("/{client_id}")
async def delete_client(
    client_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a client (only if it belongs to current user's organization)."""

    # Get client to delete
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.organization_id == current_user.organization_id
        )
    )
    client = result.scalar_one_or_none()

    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")

    # Delete client
    await db.delete(client)
    await db.commit()

    return {"message": "Client deleted successfully"}
