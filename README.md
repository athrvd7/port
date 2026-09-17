# Portx — Port & Process Manager

A terminal-based port and process manager CLI built with Node.js. Scan ports, inspect processes, kill runaway services, and monitor your system in real-time — all from a beautiful TUI.

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Platform](https://img.shields.io/badge/platform-macos%20%7C%20linux-blue)

## Features

- **Port Scanner** — Scan TCP ports with configurable ranges (common, all, or custom), batched scanning with progress spinner, results table with service names and PID detection, and inline kill flow
- **Process Inspector** — Search processes by PID, name (fuzzy match), or port; view detailed process cards with CPU, memory, and runtime info
- **Kill Process** — Safely terminate processes with confirmation, dual fallback (SIGKILL → exec kill -9), permission error handling
- **Live Monitor** — Real-time Blessed TUI dashboard with Active Ports panel, Top Processes panel, Activity Log panel, and keybindings (q/r/k)
- **Activity Logs** — Paginated, color-coded log viewer (SCAN=cyan, KILL=red, INFO=gray), with clear and export to .txt
- **CLI Shortcuts** — Direct commands for all features plus --help and --version flags

## Requirements

- **Node.js** v18 or higher
- **macOS** or **Linux**

## Install

```bash
# Clone or navigate to the project directory
cd portx

# Install dependencies
npm install

# Install globally (makes `portx` available from anywhere)
npm install -g .
```

## Usage

### Interactive Menu

```bash
portx
```

Launches the full interactive TUI with banner and menu.

### Direct Commands

```bash
portx scan             # Open port scanner directly
portx kill <pid>       # Kill process by PID (with confirmation)
portx monitor          # Open live Blessed TUI dashboard
portx logs             # View paginated activity logs
```

### Flags

```bash
portx --help           # Show help text
portx --version        # Show version (v1.0.0)
```

## Screenshots

```
██████╗  ██████╗ ██████╗ ████████╗██╗  ██╗
██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝╚██╗██╔╝
██████╔╝██║   ██║██████╔╝   ██║    ╚███╔╝
██╔═══╝ ██║   ██║██╔══██╗   ██║    ██╔██╗
██║     ╚██████╔╝██║  ██║   ██║   ██╔╝ ██╗
╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝

  Port & Process Manager  v1.0.0
  ──────────────────────────────────────────────────

  [1]  Scan Ports
  [2]  Inspect Process
  [3]  Kill Process
  [4]  Live Monitor
  [5]  View Logs
  [6]  Exit
```

## Project Structure

```
portx/
├── bin/
│   └── portx.js              # Entry point, CLI flag router
├── src/
│   ├── ui/
│   │   ├── banner.js         # ASCII art banner renderer
│   │   ├── menu.js           # Main menu (inquirer)
│   │   └── monitor.js        # Live Blessed TUI dashboard
│   ├── core/
│   │   ├── ports.js          # Port scanning logic (net module)
│   │   ├── processes.js      # Process inspect + kill logic
│   │   └── logger.js         # File-based logger + log viewer
│   └── utils/
│       └── helpers.js        # Platform detection, service name map, formatters
├── logs/
│   └── portx.log             # Auto-created at runtime
├── package.json
└── README.md
```

## Tech Stack

| Purpose           | Package              |
|-------------------|----------------------|
| ASCII Banner      | `figlet`             |
| Terminal Styling  | `chalk`              |
| Interactive Menu  | `inquirer`           |
| TUI Dashboard     | `blessed`            |
| Tables            | `cli-table3`         |
| Spinners          | `ora`                |
| Process Info      | `ps-list`            |

## Architecture

- **CommonJS** throughout — no ESM mixing
- **Platform-aware** — uses `os.platform()` to branch between macOS (`lsof`) and Linux (`ss`)
- **Safe operations** — all exec calls handle stderr, permission errors never crash the app
- **File-based logging** — every action logged to `logs/portx.log` in `[YYYY-MM-DD HH:MM:SS] [ACTION]` format
- **All modules under 150 lines** — clean, focused single-responsibility files

## License

ISC
