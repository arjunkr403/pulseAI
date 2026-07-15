from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import chat, metrics, incidents
from db.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()

    yield

    # shutdown, cleanup code

app = FastAPI(
    title="PulseAI API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

app.include_router(chat.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")

@app.get("/")
def root():
    return {"status":"PulseAI Running"}
