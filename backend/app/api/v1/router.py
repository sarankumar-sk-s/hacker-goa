from fastapi import APIRouter
from app.api.v1.endpoints import generator

api_router = APIRouter()
api_router.include_router(generator.router, tags=["Generator"])
