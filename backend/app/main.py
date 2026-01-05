from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from .config import get_settings
from .database import get_db
from .auth import verify_password, get_password_hash, create_access_token
from .api import units, doctors, macro_periods, public

settings = get_settings()

app = FastAPI(
    title="Sistema de Gestão de Macro Períodos",
    description="Sistema para gerenciamento de disponibilidade de médicos",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(public.router)
app.include_router(units.router)
app.include_router(doctors.router)
app.include_router(macro_periods.router)


@app.get("/")
def read_root():
    return {
        "message": "Sistema de Gestão de Macro Períodos API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.post("/auth/login")
def login(email: str, password: str):
    """Simple admin login - in production, use proper user management"""
    if email == settings.admin_email and password == settings.admin_password:
        access_token = create_access_token(
            data={"sub": email},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.get("/health")
def health_check():
    return {"status": "healthy"}
