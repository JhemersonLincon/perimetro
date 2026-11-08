from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, campaigns, entities, events, sessions
from app.core.config import settings

upload_root = Path(settings.UPLOAD_DIR)
(upload_root / "campaigns").mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "API REST para gerenciamento, documentação histórica e visualização "
        "de linhas do tempo interativas para campanhas de RPG de mesa."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(campaigns.router, prefix=settings.API_PREFIX)
app.include_router(entities.router, prefix=settings.API_PREFIX)
app.include_router(events.router, prefix=settings.API_PREFIX)
app.include_router(sessions.router, prefix=settings.API_PREFIX)
app.mount(
    f"{settings.API_PREFIX}/uploads",
    StaticFiles(directory=str(upload_root)),
    name="uploads",
)


@app.get("/api/health", tags=["Sistema"])
def health_check():
    """Verifica a disponibilidade da API."""
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": settings.VERSION}
