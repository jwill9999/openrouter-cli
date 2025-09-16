SHELL := /bin/bash
.DEFAULT_GOAL := help

NPM ?= npm
ARGS ?=
ARGS_STRIPPED := \
  $(strip $(ARGS))

API_ENV_VARS := OPENROUTER_API_KEY OPENAI_API_KEY

CONFIG_DIR ?= $(HOME)/.config/openrouter-cli
CONFIG_FILE := $(CONFIG_DIR)/config.json
PROJECT_RCS := .openrouterrc .openrouterrc.json .openrouterrc.yaml .openrouterrc.yml

ifeq ($(ARGS_STRIPPED),)
RUN_ARGS :=
else
RUN_ARGS := -- $(ARGS_STRIPPED)
endif

.PHONY: help install dev build lint test test-watch test-sanitized check openrouter clean commit reset-config

help: ## Show available make targets
	@printf 'Available targets:\n'
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		sed 's/:.*##/:/' | awk -F':' '{printf "  %-15s %s\n", $$1, $$2}'

install: ## Install project dependencies
	$(NPM) install

dev: ## Run the CLI via ts-node (pass extra args with ARGS="-- ask \"Hi\"")
	$(NPM) run dev$(RUN_ARGS)

build: ## Compile TypeScript to dist/
	$(NPM) run build

lint: ## Lint the TypeScript sources
	$(NPM) run lint

test: ## Run the Vitest suite once
	$(NPM) test

test-watch: ## Run Vitest in watch mode
	$(NPM) run test:watch

test-sanitized: ## Run tests after unsetting API key env vars (mirrors CI env)
	unset $(API_ENV_VARS); $(NPM) test

check: lint test ## Run lint and tests together

openrouter: build ## Execute the built CLI (pass args with ARGS="--help")
	./bin/openrouter $(ARGS)

clean: ## Remove generated build output
	rm -rf dist

reset-config: ## Danger: remove persisted CLI config (global + local overrides)
	rm -f $(CONFIG_FILE)
	rm -f $(addprefix $(CURDIR)/,$(PROJECT_RCS))
	@for var in $(API_ENV_VARS); do \
	  if [ -n "$${!var+x}" ]; then \
	    echo "Warning: $$var still set in shell (remove from dotfiles before tests)"; \
	  fi; \
	done

commit: ## Launch Commitizen for a Conventional Commit message
	$(NPM) run commit
