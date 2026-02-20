.PHONY: backend-install frontend-install run-backend run-frontend test-backend test-frontend test

test-backend:
	cd apps/backend && poetry run pytest tests/ -v --tb=short

test-frontend:
	cd apps/frontend && npx vitest run

test:
	make test-backend && make test-frontend

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

# Deployment Configuration
ROOT_DIR := $(shell pwd)
PID_DIR := $(ROOT_DIR)/.deploy
BACKEND_PID_FILE := $(PID_DIR)/backend.pid
FRONTEND_PID_FILE := $(PID_DIR)/frontend.pid
LOG_DIR := $(PID_DIR)/logs
ENV_FILE ?= .env.prod

deploy:
	@mkdir -p $(PID_DIR) $(LOG_DIR)
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "Error: Deployment environment file '$(ENV_FILE)' not found."; \
		echo "Please create it or specify another file with ENV_FILE=path/to/env make deploy"; \
		exit 1; \
	fi
	@echo "Using env file: $(ENV_FILE)"
	@make prod-stop
	@echo "Starting Deployment..."
	
	# Frontend Build & Deploy
	@echo "[Frontend] Installing dependencies..."
	@cd apps/frontend && npm ci
	@echo "[Frontend] Building with $(ENV_FILE)..."
	@cp $(ROOT_DIR)/$(ENV_FILE) apps/frontend/.env.production.local
	@cd apps/frontend && npm run build
	@echo "[Frontend] Serving..."
	@cd apps/frontend && \
		nohup npx serve -s dist -l 3070 > $(LOG_DIR)/frontend.log 2>&1 & \
		echo $$! > $(FRONTEND_PID_FILE)
		
	# Backend Deploy
	@echo "[Backend] Starting..."
	@cd apps/backend && \
		(set -a; . $(ROOT_DIR)/$(ENV_FILE); set +a; \
		nohup ./venv/bin/poetry run uvicorn main:app --host 0.0.0.0 --port 3071 > $(LOG_DIR)/backend.log 2>&1 & \
		echo $$! > $(BACKEND_PID_FILE))
		
	@echo "Deployment successfully started in background."
	@echo "Logs: $(LOG_DIR)"
	@echo "PIDs: $(PID_DIR)"

prod-stop:
	@echo "Stopping production deployment..."
	@echo "Stopping Backend (Port 3071)..."
	@fuser -k -n tcp 3071 || echo "Backend not running on port 3071."
	@if [ -f $(BACKEND_PID_FILE) ]; then rm $(BACKEND_PID_FILE); fi

	@echo "Stopping Frontend (Port 3070)..."
	@fuser -k -n tcp 3070 || echo "Frontend not running on port 3070."
	@if [ -f $(FRONTEND_PID_FILE) ]; then rm $(FRONTEND_PID_FILE); fi
	@echo "Stopped."
