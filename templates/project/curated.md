---
# Copy to content/projects/<slug>.md — the file name is the URL (/projects/<slug>).
#
# A curated page REPLACES the GitHub page for the same repo: docs, PDFs, PCB files,
# gallery, charts, commits and contributors from the repo are no longer shown.
# Only use this for a project without a public repo, or one that needs the
# fields below that a repo cannot provide. See templates/project/README.md.

title: "Project Name"
description: "One or two sentences — used on the card, as the subtitle and as the meta description."
category: "Embedded"            # Embedded | IoT | ML | DevOps | Tools | Web | Rust | Python | Other
techStack: ["C", "KiCad", "STM32"]
featured: false                 # true = highlighted on the projects page
image: /media/curated/<slug>/cover.jpg
github: https://github.com/mitaadevelop/<repo>    # optional; dedupes the GitHub page
demo: https://example.com                        # optional "Demo" button

context: "Where this came from — course, job, side project."
role: "What you did."
goal: "What it had to achieve."
features:
  - "Feature with a concrete number"
  - "Another feature"

# --- Media (files under public/media/curated/<slug>/, committed) ---
video: "https://www.youtube.com/watch?v=..."     # or /media/curated/<slug>/demo.mp4
gallery:
  - /media/curated/<slug>/01-board.jpg
  - /media/curated/<slug>/02-enclosure.jpg
measurements:
  - src: /media/curated/<slug>/measurements/step-response.csv
    title: "Closed-loop step response"
    xLabel: "Time (ms)"
    yLabel: "Voltage (V)"

# --- PDFs (files under public/docs/curated/<slug>/, committed) ---
pdfs:
  - src: /docs/curated/<slug>/datasheet.pdf
    label: "Datasheet"

# --- Hardware (files under public/pcb/<slug>/; .step is converted to .glb on build) ---
# Generate the images locally: npm run pcb:render <board.kicad_pcb> <schematic.kicad_sch>
pcb:
  schematic: /pcb/<slug>/board.kicad_sch
  board: /pcb/<slug>/board.kicad_pcb
  model3d: /pcb/<slug>/board.step
  bom: /pcb/<slug>/bom.csv
  schematicImage: /pcb/<slug>/img/schematic.svg
  pcbImage: /pcb/<slug>/img/pcb-top.svg
  pcbBackImage: /pcb/<slug>/img/pcb-bottom.svg
  pcbXrayImage: /pcb/<slug>/img/pcb-xray.svg
---

The body is markdown and becomes the main text of the page. Delete every
frontmatter key above that you don't use.
