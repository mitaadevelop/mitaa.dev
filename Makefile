# mitaa.dev — shortcuts for the npm scripts and the local tooling.
# `make` (or `make help`) lists every target. Arguments are passed as
# variables: make blog-check POST=report-design-showcase
#
# Works with the GNU Make 3.81 that ships with macOS.

PORT ?= 3000

.DEFAULT_GOAL := help
.PHONY: help install run dev build build-fast start preview data \
        lint typecheck test test-update check deps \
        downloads translate new-post blog-check blog-publish \
        pcb-render pcb-convert pcb-recolor \
        clean distclean fix-biber

## —— Setup ———————————————————————————————————————————————————————————

help: ## Show this list
	@awk 'BEGIN {FS = ":.*## "} /^## ——/ {printf "\n\033[1m%s\033[0m\n", substr($$0, 4); next} /^[a-zA-Z_-]+:.*## / {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo

install: ## Install dependencies from package-lock.json
	npm ci

data: ## Fetch GitHub repos, contributions and project assets into public/ (tokens from .env.local)
	node $(if $(wildcard .env.local),--env-file=.env.local) scripts/fetch-github-data.mjs

## —— Develop ——————————————————————————————————————————————————————————

run: dev ## Same as dev

dev: ## Start the dev server on PORT (default 3000)
	npm run dev -- -p $(PORT)

## —— Build ————————————————————————————————————————————————————————————

build: ## Full production build: GitHub fetch + STEP conversion + next build
	npm run build

build-fast: ## next build only, without fetching GitHub data first
	npx next build

start: ## Serve the last production build on PORT
	npm start -- -p $(PORT)

preview: build-fast start ## Build without the GitHub fetch, then serve it

## —— Quality ——————————————————————————————————————————————————————————

lint: ## Run ESLint
	npm run lint

typecheck: ## Run the TypeScript compiler (generates route types first)
	npx next typegen
	npx tsc --noEmit

test: ## Run the test suite
	npm test

test-update: ## Run the tests and accept new blog snapshots (read the diff!)
	UPDATE_SNAPSHOTS=1 npm test

check: typecheck lint test ## typecheck + lint + test, as before a commit

deps: ## Check that exactly one katex and one gsap are installed
	npm ls katex gsap

## —— Content —————————————————————————————————————————————————————————

translate: ## Machine-translate the bio and the posts into the other language (needs ANTHROPIC_API_KEY, else cache only)
	npm run translate

downloads: ## Rebuild the shop downloads (ONLY="essay cheatsheet" for a few)
	npm run downloads:build -- $(ONLY)

new-post: ## Start a blog post from the template (POST=<slug> [TITLE="A title"])
	@test -n "$(POST)" || { echo 'usage: make new-post POST=<slug> [TITLE="A title"]'; exit 1; }
	npm run new:post -- $(POST) $(TITLE)

blog-check: ## Compile a post with LaTeX and compare numbering (POST=<slug>)
	@test -n "$(POST)" || { echo "usage: make blog-check POST=<slug>"; exit 1; }
	npm run blog:check -- $(POST)

blog-publish: ## Same as blog-check, then publish the PDF (POST=<slug>)
	@test -n "$(POST)" || { echo "usage: make blog-publish POST=<slug>"; exit 1; }
	npm run blog:check -- $(POST) --publish

## —— Hardware —————————————————————————————————————————————————————————

pcb-render: ## Render schematic/PCB SVGs with kicad-cli (BOARD=<.kicad_pcb> [SCH=<.kicad_sch>])
	@test -n "$(BOARD)" || { echo "usage: make pcb-render BOARD=<board.kicad_pcb> [SCH=<schematic.kicad_sch>]"; exit 1; }
	npm run pcb:render -- "$(BOARD)" $(if $(SCH),"$(SCH)")

pcb-convert: ## Convert a STEP model to GLB (IN=<.step> OUT=<.glb>)
	@test -n "$(IN)" -a -n "$(OUT)" || { echo "usage: make pcb-convert IN=<model.step> OUT=<model.glb>"; exit 1; }
	npm run pcb:convert -- "$(IN)" "$(OUT)"

pcb-recolor: ## Recolour a board GLB (IN=<.glb> OUT=<.glb> ARGS='--board "#1a5c3a"')
	@test -n "$(IN)" -a -n "$(OUT)" -a -n '$(ARGS)' || { echo "usage: make pcb-recolor IN=<in.glb> OUT=<out.glb> ARGS='--board \"#hex\" [--silk \"#hex\"] [--finish \"#hex\"]'"; exit 1; }
	npm run pcb:recolor -- "$(IN)" "$(OUT)" $(ARGS)

## —— Housekeeping ————————————————————————————————————————————————————

clean: ## Remove the Next build output (.next)
	rm -rf .next

distclean: clean ## Also remove node_modules (run make install afterwards)
	rm -rf node_modules

fix-biber: ## Clear Biber's cache when it fails with "unicore/version"
	rm -rf "$$(biber --cache)"
