# Architecture

> Tab label on the site: "architecture". The file name is the label — rename the file to rename the tab.

## Block diagram

```
[ sensor ] --I2C--> [ MCU ] --UART--> [ host ]
                       |
                    [ flash ]
```

## Hardware

Main parts and why they were chosen. The interactive schematic, PCB and 3D view
are generated from the `PCB/` folder, so no need to embed them here.

| Part | Role | Why this one |
| --- | --- | --- |
| MCU | | |
| Power | | |

## Firmware / software

Modules, how data flows between them, and the one design decision that matters most.

## Trade-offs

What you gave up, and why that was acceptable.
