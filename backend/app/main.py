from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_db, close_db
from app.routes.auth import router as auth_router
from app.routes.research import router as research_router
from app.routes.pdf import router as pdf_router
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown events."""
    await connect_db()
    yield
    await close_db()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="AI Research Assistant",
        description="A full-stack AI Research Assistant powered by CrewAI",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router)
    app.include_router(research_router)
    app.include_router(pdf_router)

    @app.get("/")
    async def root():
        return {"message": "AI Research Assistant API is running"}

    return app


app = create_app()
