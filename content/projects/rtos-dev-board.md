---
title: "RTOS Dev Board"
description: "A custom development board for bare-metal RTOS experiments — designed end to end in KiCad, shown here with an interactive schematic, PCB layout and 3D view."
category: "Embedded"
techStack: ["KiCad", "C", "ARM Cortex-M", "FreeRTOS"]
featured: true
context: "Personal hardware project to test a from-scratch task scheduler on real silicon."
role: "Hardware & Firmware"
goal: "Bring up a minimal board with everything needed to run and debug a custom RTOS."
features:
  - "Pre-rendered schematic with pan & zoom"
  - "PCB with Top / Bottom / X-ray views"
  - "Rotatable 3D board preview"
  - "Searchable bill of materials"
video: "https://www.youtube.com/watch?v=aVUqaB0IMh4"
gallery:
  - /media/curated/rtos-dev-board/photo-1.png
  - /media/curated/rtos-dev-board/photo-2.svg
  - /media/curated/rtos-dev-board/photo-3.svg
measurements:
  - src: /media/curated/rtos-dev-board/measurements/step-response.csv
    title: "Closed-loop step response"
    xLabel: "Time (ms)"
    yLabel: "Voltage (V)"
pcb:
  schematic: /pcb/demo-board/board.kicad_sch
  board: /pcb/demo-board/board.kicad_pcb
  model3d: /pcb/demo-board/board.step
  bom: /pcb/demo-board/bom.csv
  # Diode-style pre-rendered images (take precedence over live KiCanvas)
  schematicImage: /pcb/demo-board/img/schematic.svg
  pcbImage: /pcb/demo-board/img/pcb-top.svg
  pcbBackImage: /pcb/demo-board/img/pcb-bottom.svg
  pcbXrayImage: /pcb/demo-board/img/pcb-xray.svg
---

This board was designed to have a real hardware target for the RTOS scheduler work.
The schematic and PCB below are pre-rendered from the KiCad design (with a Top /
Bottom / X-ray toggle on the board), alongside a rotatable 3D model and a searchable
bill of materials.
