.PHONY: backend-install frontend-install run-backend run-frontend

backend-install:
	cd apps/backend && ./venv/bin/poetry install

frontend-install:
	cd apps/frontend && npm install

run-backend:
	cd apps/backend && ./venv/bin/poetry run uvicorn main:app --reload --port 3071

run-frontend:
	cd apps/frontend && npm run dev -- --port 3070

run-all:
	make run-backend & make run-frontend
