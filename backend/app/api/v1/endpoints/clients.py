from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_supabase_user, check_supabase_subscription
from app.db.session import get_db
from app.models.client import Client
from app.models.user import Profile, Organization
from app.schemas.client import ClientCreate
from app.services.billing_service import BillingService

router = APIRouter()


@router.post("/", response_model=dict)
async def create_client(
    client_data: ClientCreate,
    current_profile: Profile = Depends(get_current_supabase_user),
    _org: Organization = Depends(check_supabase_subscription),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Create a new client for the current user's organization."""

    # Check subscription limits
    await BillingService.check_client_limit(current_profile.organization_id, db)

    # Create client linked to current user's organization
    client = Client(
        full_name=client_data.full_name,
        email=client_data.email,
        cnpj=client_data.cnpj,
        address=client_data.address,
        phone=client_data.phone,
        organization_id=current_profile.organization_id
    )

    db.add(client)
    await db.commit()
    await db.refresh(client)

    return {
        "id": client.id,
        "full_name": client.full_name,
        "email": client.email,
        "cnpj": client.cnpj,
        "address": client.address,
        "phone": client.phone,
        "organization_id": client.organization_id,
        "created_at": client.created_at
    }


@router.get("/", response_model=List[dict])
async def get_clients(
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: Organization = Depends(check_supabase_subscription)
) -> List[dict]:
    """Get all clients for the current user's organization."""

    # Get only clients from current user's organization (data isolation)
    result = await db.execute(
        select(Client).where(Client.organization_id == current_profile.organization_id)
    )
    clients = result.scalars().all()

    return [{
        "id": client.id,
        "full_name": client.full_name,
        "email": client.email,
        "cnpj": client.cnpj,
        "address": client.address,
        "phone": client.phone,
        "organization_id": client.organization_id,
        "created_at": client.created_at
    } for client in clients]


@router.put("/{client_id}", response_model=dict)
async def update_client(
    client_id: int,
    client_data: ClientCreate,
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: Organization = Depends(check_supabase_subscription)
) -> dict:
    """Update a client (only if it belongs to current user's organization)."""

    # Get client to update
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.organization_id == current_profile.organization_id
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

    return {
        "id": client.id,
        "full_name": client.full_name,
        "email": client.email,
        "cnpj": client.cnpj,
        "address": client.address,
        "phone": client.phone,
        "organization_id": client.organization_id,
        "created_at": client.created_at
    }


@router.delete("/{client_id}")
async def delete_client(
    client_id: int,
    current_profile: Profile = Depends(get_current_supabase_user),
    db: AsyncSession = Depends(get_db),
    org: Organization = Depends(check_supabase_subscription)
):
    """Delete a client (only if it belongs to current user's organization)."""

    # Get client to delete
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.organization_id == current_profile.organization_id
        )
    )
    client = result.scalar_one_or_none()

    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")

    # Delete client
    await db.delete(client)
    await db.commit()

    return {"message": "Client deleted successfully"}
