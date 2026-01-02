from app.db.base_class import Base

# Import all models here so that Alembic can see them
from app.models.client import Client
from app.models.expense import Expense
from app.models.production import Production
from app.models.production_item import ProductionItem
from app.models.service import Service
from app.models.user import Organization, User

# This file is only used by Alembic to discover model metadata
# Do not import Base from this file in other parts of the application
