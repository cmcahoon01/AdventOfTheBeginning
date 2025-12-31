# AdventOfTheBeginning

A Screeps Arena bot implementation featuring an adaptive build order system and specialized creep jobs.

## Project Overview

This project implements a bot for Screeps Arena with approximately 1,500 lines of code. The bot features:

- **Adaptive Build Strategy**: Dynamically switches between military and logistics focus based on relative team strength
- **Specialized Creep Jobs**: Modular job system with fighters, archers, clerics, haulers, and miners
- **Automated Resource Management**: Intelligent energy collection and distribution
- **Combat AI**: Coordinated ranged combat with kiting and healing

## Architecture

### Core Components

- **`src/main.mjs`**: Entry point with the main game loop
- **`src/controllers/`**: High-level game logic controllers
  - `ScreepController.mjs`: Manages all creeps and their lifecycle
  - `BuildOrder.mjs`: Determines build queue based on game state
- **`src/combat/`**: Combat-related systems
  - `strengthEstimator.mjs`: Calculates and compares team combat strengths
- **`src/jobs/`**: Creep behavior implementations
  - `ActiveCreep.mjs`: Base class for all creep jobs
  - `archer.mjs`, `cleric.mjs`, `fighter.mjs`: Combat units
  - `hauler.mjs`, `miner.mjs`: Economic units
  - `RangedJob.mjs`: Shared ranged combat behavior
  - `JobRegistry.mjs`: Job type registry

### Build Strategy

The bot follows a two-phase build strategy:

1. **Initial Build**: Always starts with a cleric and hauler for basic offense and economy
2. **Adaptive Build**: 
   - If team strength >= 80% of enemy: Focus on logistics (miners and haulers)
   - If team strength < 80% of enemy: Focus on military (archers and clerics at 3:1 ratio)

## Getting Started

### Prerequisites

- Node.js (ES6+ support required)
- Screeps Arena client/server

### Project Structure

```
AdventOfTheBeginning/
├── src/
│   ├── main.mjs              # Entry point
│   ├── controllers/          # Game logic controllers
│   ├── combat/               # Combat systems
│   └── jobs/                 # Creep behaviors
├── docs/                     # Documentation
├── typings/                  # TypeScript type definitions
├── jsconfig.json             # JavaScript configuration
└── README.md                 # This file
```

### Running the Bot

1. Clone this repository into your Screeps Arena bot directory
2. The arena will automatically load `src/main.mjs` as the entry point
3. Deploy and run in the Screeps Arena client

### Development

The project uses ES6 modules with JSConfig for IDE support. Type definitions are provided in the `typings/` directory for the Screeps Arena API.

## Documentation

- **[Screeps API Reference](docs/screeps-api-reference.md)**: Complete API documentation
- **[Strength Estimator](docs/STRENGTH_ESTIMATOR.md)**: Details on combat strength calculations
- **[Refactoring Plan](REFACTORING_PLAN.md)**: Technical debt and improvement roadmap

## Features

### Creep Jobs

- **Fighter**: Melee combat unit (currently unused in build order)
- **Archer**: Ranged attacker with kiting behavior
- **Cleric**: Ranged healer that supports allies and attacks enemies
- **Hauler**: Collects energy from miners and delivers to spawn/extensions
- **Miner**: Harvests energy from sources and builds extensions

### Key Systems

- **Strength Estimation**: Real-time combat power calculation with multipliers for:
  - Ranged advantage (3x)
  - Healing effectiveness (varies by unit type)
  - Rampart protection
  
- **Kiting AI**: Ranged units automatically maintain optimal distance from enemies

- **Resource Management**: Automated energy collection, transportation, and extension construction

## Contributing

See [REFACTORING_PLAN.md](REFACTORING_PLAN.md) for identified technical debt and improvement opportunities.

## License

This project is for educational and competitive purposes in Screeps Arena.
