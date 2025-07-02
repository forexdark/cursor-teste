import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import router
from scheduler import start_scheduler

load_dotenv()

app = FastAPI(title="VigIA Backend", version="1.0.0")

# CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

start_scheduler()

@app.get("/")
def root():
    return {"message": "VigIA Backend rodando!"}

@app.get("/health")
def health():
    return {"status": "ok"} 