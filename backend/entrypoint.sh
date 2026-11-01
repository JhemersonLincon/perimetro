#!/bin/sh
set -e

echo "Executando migrações do banco de dados com Alembic..."
alembic upgrade head

echo "Iniciando servidor FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
