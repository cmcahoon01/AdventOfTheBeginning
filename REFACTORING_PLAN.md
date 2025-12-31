# Refactoring Plan

This document outlines technical debt and areas for improvement in the AdventOfTheBeginning Screeps Arena project.

## Project Overview

The project is a Screeps Arena bot implementation with ~1,500 lines of code across:
- Main entry point (`main.mjs`)
- Core controllers (`ScreepController.mjs`, `BuildOrder.mjs`)
- Combat strength estimation (`strengthEstimator.mjs`)
- Job system with base classes and specialized jobs in `creep_jobs/` directory

---

## 1. File Structure and Organization

### Issues:

#### 1.1 Flat Root Directory Structure
**Problem:** All main modules are in the root directory with no clear organization.
- `main.mjs`, `ScreepController.mjs`, `BuildOrder.mjs`, `strengthEstimator.mjs` are all at root level
- Only the `creep_jobs/` subdirectory provides some organization
- Makes the project harder to navigate as it grows

**Impact:** Medium
**Suggestion:** Consider organizing into logical subdirectories:
```
src/
  controllers/
    ScreepController.mjs
    BuildOrder.mjs
  combat/
    strengthEstimator.mjs
  jobs/
    (existing creep_jobs content)
  main.mjs
```

#### 1.2 Mixed Documentation Types
**Problem:** Multiple documentation files at root with different purposes:
- `documentation.md` - appears to be API documentation (46KB, copied from external source)
- `STRENGTH_ESTIMATOR.md` - module-specific documentation
- No `README.md` for the project itself

**Impact:** Low
**Suggestion:** 
- Rename or relocate `documentation.md` to `docs/screeps-api-reference.md`
- Create a proper `README.md` with project overview, setup instructions, and architecture
- Consider moving module docs into a `docs/` directory

#### 1.3 Typings Directory Structure
**Problem:** The `typings/` directory is included but its organization isn't documented.

**Impact:** Low
**Suggestion:** This directory should not change, as it is taken from the official Screeps Arena typings. It should be constant between all projects using the Arena API.

---

## 2. Class Responsibilities and Separation of Concerns

### Issues:

#### 2.1 BuildOrder Class Has Multiple Responsibilities
**Problem:** `BuildOrder.mjs` violates Single Responsibility Principle:
- Manages spawn queue logic
- Calculates energy availability across multiple structure types
- Implements complex build order strategy (initial build, adaptive phases)
- Handles pending spawn tracking
- Contains strategy decision logic (strength threshold comparisons)

**Impact:** High
**Lines:** 214 lines in a single class

**Suggestion:** Split into multiple focused classes:
- `EnergyManager` - handle energy calculations across spawn/extensions
- `BuildQueue` - manage spawn queue and pending spawns
- `BuildStrategy` - decide what to build based on game state
- `BuildOrder` - orchestrate between these components

#### 2.2 RangedJob Contains Complex Pathfinding Logic
**Problem:** `RangedJob.mjs` (304 lines) contains sophisticated movement/kiting algorithms mixed with combat logic:
- Kiting behavior calculation
- Position validation and terrain checking
- Enemy distance calculations
- Attack targeting
- Healing coordination

**Impact:** High
**Suggestion:** Extract movement logic into separate classes:
- `KitingBehavior` or `MovementStrategy` - handle tactical positioning
- `TerrainAnalyzer` - handle terrain and position validation
- Keep `RangedJob` focused on high-level combat coordination

#### 2.3 MinerJob Handles Too Many Concerns
**Problem:** `MinerJob.mjs` (347 lines) manages:
- Source assignment algorithm
- Mining position calculation (team-side aware)
- Extension construction site creation
- Extension building
- Extension filling
- State machine management (moving, mining, building, depositing)

**Impact:** High
**Suggestion:** Extract into:
- `SourceAssignmentStrategy` - handle source selection logic
- `ExtensionBuilder` - manage extension construction
- `MinerStateMachine` - separate state management
- Keep `MinerJob` as a thin coordinator

#### 2.4 Hauler Has Commented-Out Code
**Problem:** `HaulerJob.mjs` contains commented-out road building logic (line 139)
```javascript
// this.tryBuildRoadToTarget(creep, target);
```
Also has dead code checking for miner creeps (line 126, commented)

**Impact:** Medium
**Suggestion:** 
- Either remove commented code or move to a feature branch
- Clean up dead code references

---

## 3. Code Duplication and Redundancy

### Issues:

#### 3.1 Repeated getObjectsByPrototype Calls
**Problem:** Multiple files repeatedly fetch the same game objects:
- `getObjectsByPrototype(StructureSpawn).find(s => s.my)` appears in many places
- `getObjectsByPrototype(Creep).filter(i => !i.my)` for enemy detection
- `getObjectsByPrototype(StructureRampart)` for rampart checking

**Impact:** Medium
**Locations:** `BuildOrder.mjs`, `FighterJob.mjs`, `RangedJob.mjs`, `HaulerJob.mjs`, `MinerJob.mjs`

**Suggestion:** Create a `GameCache` or `GameState` service that caches these queries per tick:
```javascript
class GameState {
  constructor() {
    this.mySpawn = null;
    this.enemySpawn = null;
    this.myCreeps = [];
    this.enemyCreeps = [];
    this.ramparts = [];
  }
  
  refresh() {
    // Update all cached values once per tick
  }
}
```

#### 3.2 Range Checking Logic Duplicated
**Problem:** Range checking patterns repeated across combat jobs:
- `getRange(creep, target) <= 3` for ranged attack range
- `getRange(creep, target) <= 1` for adjacent checks
- Similar patterns in `RangedJob`, `FighterJob`, `MinerJob`

**Impact:** Low
**Suggestion:** Create utility functions or constants:
```javascript
const RANGED_ATTACK_RANGE = 3;
const ADJACENT_RANGE = 1;

function isInRangedAttackRange(from, to) {
  return getRange(from, to) <= RANGED_ATTACK_RANGE;
}
```

#### 3.3 Enemy Filtering Logic Duplicated
**Problem:** Both `FighterJob` and `RangedJob` have similar logic for filtering enemies on ramparts:
- `FighterJob.mjs` lines 27-39
- `RangedJob.mjs` lines 228-253
Slightly different implementations doing essentially the same thing

**Impact:** Medium
**Suggestion:** Extract to a shared utility:
```javascript
class CombatUtils {
  static filterEnemiesByRampartStatus(enemies, ramparts) {
    // Shared implementation
  }
}
```

#### 3.4 Position Validation Repeated
**Problem:** Bounds checking `pos.x >= 0 && pos.x < 100` appears in multiple places:
- `RangedJob.mjs` line 39
- `MinerJob.mjs` lines 117, 152

**Impact:** Low
**Suggestion:** Create a utility function:
```javascript
const ARENA_SIZE = 100;
function isValidPosition(pos) {
  return pos.x >= 0 && pos.x < ARENA_SIZE && 
         pos.y >= 0 && pos.y < ARENA_SIZE;
}
```

---

## 4. Magic Numbers and Hard-coded Values

### Issues:

#### 4.1 Build Order Thresholds
**Problem:** Strategy thresholds are hard-coded in `BuildOrder.mjs`:
- `STRENGTH_THRESHOLD = 0.8` (line 15) - not clear why 0.8 specifically
- `ARCHER_TO_CLERIC_RATIO = 3` (line 18) - ratio choice not documented
- `INITIAL_BUILD_ORDER` array hard-coded (lines 9-12)

**Impact:** Medium
**Suggestion:** Move to a configuration object with documentation:
```javascript
const BuildConfig = {
  STRENGTH_THRESHOLD: 0.8, // Switch to logistics when >= 80% enemy strength
  MILITARY_RATIO: {
    ARCHERS_PER_CLERIC: 3 // Offensive composition
  },
  INITIAL_BUILD: ['cleric', 'hauler']
};
```

#### 4.2 Body Part Costs Hard-coded
**Problem:** Each job class has hard-coded `COST` values:
- `FighterJob.COST = 130` with comment "50 + 80" 
- `ArcherJob.COST = 200` with comment "50 + 150"
- No central definition of body part costs

**Impact:** Low
**Suggestion:** Create a cost calculator or central cost constants:
```javascript
const BODY_PART_COSTS = {
  MOVE: 50,
  ATTACK: 80,
  RANGED_ATTACK: 150,
  HEAL: 250,
  WORK: 100,
  CARRY: 50
};

class BodyPartCalculator {
  static calculateCost(bodyParts) {
    return bodyParts.reduce((sum, part) => sum + BODY_PART_COSTS[part], 0);
  }
}
```

#### 4.3 Mining Configuration Constants
**Problem:** `MinerJob.mjs` has multiple hard-coded positioning values:
- `EXTENSIONS_PER_MINER = 5` (line 8)
- Corner source detection uses `y < 30` and `y > 70` (lines 52, 63)
- Map center detection uses `y >= 30 && y <= 70` (line 104 in `HaulerJob`)

**Impact:** Medium
**Suggestion:** Centralize map topology constants:
```javascript
const MapTopology = {
  CORNER_TOP_THRESHOLD: 30,
  CORNER_BOTTOM_THRESHOLD: 70,
  EXTENSIONS_PER_MINER: 5
};
```

#### 4.4 Combat Multipliers
**Problem:** `strengthEstimator.mjs` has multiple empirical constants:
- `RANGED_ADVANTAGE_MULTIPLIER = 3` (line 36)
- `RANGED_HEAL_MULTIPLIER = 2.0` (line 40)
- `MELEE_HEAL_MULTIPLIER = 0.5` (line 44)
- `SUPPORT_HEAL_MULTIPLIER = 1` (line 48)

**Impact:** Low (well documented)
**Suggestion:** These are already well-commented with rationale, but could be moved to a `CombatConfig` object for easier tuning.

#### 4.5 Road Construction Limit
**Problem:** `HaulerJob.mjs` has `MAX_ROAD_CONSTRUCTION = 6` (line 7) with no explanation of why 6.

**Impact:** Low
**Suggestion:** Document the rationale or make it configurable.

---

## 5. Potential Abstractions and OOP Improvements

### Issues:

#### 5.1 No Strategy Pattern for Build Orders
**Problem:** Build order logic is procedural with if-else chains:
- Lines 68-95: Initial build order checking
- Lines 105-149: Adaptive strategy selection
All in one method `getNextCreepToBuild()`

**Impact:** Medium
**Suggestion:** Implement Strategy pattern:
```javascript
class BuildStrategy {
  getNextUnit(creepCounts, teamStrength) { }
}

class InitialBuildStrategy extends BuildStrategy { }
class LogisticsBuildStrategy extends BuildStrategy { }
class MilitaryBuildStrategy extends BuildStrategy { }

class BuildOrderManager {
  selectStrategy(gameState) {
    if (!this.initialComplete()) return new InitialBuildStrategy();
    if (gameState.isStronger()) return new LogisticsBuildStrategy();
    return new MilitaryBuildStrategy();
  }
}
```

#### 5.2 State Machine Could Be Formalized
**Problem:** Both `HaulerJob` and `MinerJob` use ad-hoc state machines with string states:
- `this.memory.state = 'mining'` / `'hauling'` in HaulerJob
- `this.memory.state = 'moving_to_position'` / `'mining'` in MinerJob
- No formal state transition validation

**Impact:** Medium
**Suggestion:** Implement formal State pattern:
```javascript
class JobState {
  onEnter(job) { }
  execute(job) { }
  onExit(job) { }
}

class MiningState extends JobState { }
class HaulingState extends JobState { }

class StateMachine {
  constructor(initialState) {
    this.currentState = initialState;
  }
  
  transition(newState) {
    this.currentState.onExit();
    this.currentState = newState;
    this.currentState.onEnter();
  }
  
  update() {
    this.currentState.execute();
  }
}
```

#### 5.3 No Dependency Injection
**Problem:** Classes directly instantiate dependencies:
- `BuildOrder` constructor takes `screepController` directly
- Jobs access global game state via `getObjectsByPrototype`
- Tight coupling makes testing difficult

**Impact:** Medium
**Suggestion:** Use dependency injection:
```javascript
class BuildOrder {
  constructor(energyManager, buildStrategy, spawnManager) {
    this.energyManager = energyManager;
    this.buildStrategy = buildStrategy;
    this.spawnManager = spawnManager;
  }
}
```

#### 5.4 No Observer Pattern for Game Events
**Problem:** No event system for inter-component communication:
- When a creep dies, ScreepController filters the array
- No notification system for other components that might care
- BuildOrder polls spawn state every tick

**Impact:** Low
**Suggestion:** Consider implementing Observer pattern for:
- Creep death events
- Spawn completion events
- Resource threshold events

#### 5.5 Hardcoded Job Registry
**Problem:** `JobRegistry.mjs` uses a frozen object with hard-coded mappings:
```javascript
export const Jobs = Object.freeze({
    fighter: FighterJob,
    archer: ArcherJob,
    // ...
});
```
Adding new jobs requires code changes in multiple places.

**Impact:** Low
**Suggestion:** Use decorator/registration pattern:
```javascript
const JobRegistry = new Map();

function RegisterJob(name) {
  return function(jobClass) {
    JobRegistry.set(name, jobClass);
    jobClass.JOB_NAME = name;
  };
}

@RegisterJob('fighter')
class FighterJob extends ActiveCreep { }
```
(Note: Decorators may require build tooling)

---

## 6. Error Handling and Edge Cases

### Issues:

#### 6.1 Minimal Error Handling
**Problem:** Most methods assume success:
- `BuildOrder.trySpawnNextCreep()` returns boolean but callers don't check it
- `ScreepController.addCreep()` logs warning for unknown jobs but doesn't throw
- Game API errors (ERR_NOT_IN_RANGE, etc.) are used for control flow but not logged

**Impact:** Medium
**Suggestion:** 
- Add try-catch blocks for critical operations
- Log errors with context for debugging
- Consider error recovery strategies

#### 6.2 Null/Undefined Checks Inconsistent
**Problem:** Some methods check for null, others don't:
- `BuildOrder.getTotalEnergy()` checks `if (spawn && spawn.store)`
- `MinerJob.assignSourceToMiner()` checks `if (sources.length < 2)`
- But many methods assume objects exist

**Impact:** Medium
**Suggestion:** 
- Establish consistent null-checking pattern
- Consider using optional chaining (`?.`) where appropriate
- Add defensive checks at class boundaries

#### 6.3 Array Access Without Bounds Checking
**Problem:** Direct array access without safety:
- `strengthEstimator.mjs` line 73: `nearestEnemy = enemies[0]` without checking length
- Protected by if-check earlier (line 89), but fragile

**Impact:** Low
**Suggestion:** Add assertions or early returns for array operations.

#### 6.4 Magic ID Undefined Check
**Problem:** In `BuildOrder.mjs` line 161:
```javascript
if (creepId === undefined){
    console.log("spawning creep undefined");
    return;
}
```
This suggests a known issue that's not properly resolved.

**Impact:** Medium
**Suggestion:** Investigate root cause and fix properly rather than working around.

---

## 7. Documentation Gaps

### Issues:

#### 7.1 Missing High-Level Architecture Documentation
**Problem:** No documentation explaining:
- How the system components interact
- The game loop flow
- Decision-making process
- Why certain architectural choices were made

**Impact:** Medium
**Suggestion:** Add `ARCHITECTURE.md` explaining:
- Component diagram
- Data flow
- Extension points
- Design decisions

#### 7.2 Incomplete Inline Documentation
**Problem:** Inconsistent JSDoc comments:
- `strengthEstimator.mjs` has excellent JSDoc (lines 50-193)
- Most other files have minimal comments
- Complex algorithms lack explanation

**Impact:** Medium
**Suggestion:** 
- Add JSDoc to all public methods
- Document complex algorithms (kiting, source assignment)
- Explain non-obvious design decisions

#### 7.3 No Configuration Documentation
**Problem:** No guide for tuning the bot:
- Which constants can be safely changed
- How different values affect behavior
- Trade-offs between strategies

**Impact:** Low
**Suggestion:** Create `TUNING.md` or configuration guide.

#### 7.4 Missing Getting Started Guide
**Problem:** No `README.md` explaining:
- How to run the bot
- Development workflow
- How to deploy to Screeps
- Dependencies and requirements

**Impact:** Medium
**Suggestion:** Create comprehensive README with quickstart instructions.

---

## 8. Performance Considerations

### Issues:

#### 8.1 Repeated getObjectsByPrototype Calls
**Problem:** Expensive game API calls made multiple times per tick:
- Every job calls `getObjectsByPrototype(Creep)` independently
- Ramparts fetched multiple times
- No caching within a tick

**Impact:** Medium (game performance)
**Suggestion:** Implement per-tick caching (see 3.1)

#### 8.2 O(n²) Operations in Position Checking
**Problem:** `RangedJob.getValidAdjacentPositions()` checks each position against all creeps:
```javascript
const hasCreep = allCreeps.some(c => c.x === pos.x && c.y === pos.y);
```
Called 8 times (for each adjacent position).

**Impact:** Low (small n in Screeps)
**Suggestion:** Build position lookup map once:
```javascript
const creepPositions = new Set(allCreeps.map(c => `${c.x},${c.y}`));
```

#### 8.3 Redundant Path Finding
**Problem:** `HaulerJob.getNextMovePosition()` calls `findPath()` but creep.moveTo() also pathfinds.

**Impact:** Low
**Suggestion:** Either use the path from moveTo() or cache path results.

#### 8.4 Array Filter Chains
**Problem:** Multiple filter operations on same array:
- `RangedJob.mjs` lines 234-242: filters enemies twice

**Impact:** Low
**Suggestion:** Combine filters where possible or use for-loop with multiple conditions.

---

## 9. Code Style and Consistency

### Issues:

#### 9.1 Inconsistent Naming Conventions
**Problem:** Mix of naming styles:
- Some constants: `MAX_ROAD_CONSTRUCTION`, `EXTENSIONS_PER_MINER`
- Some variables: `enemySpawn`, `allHostileCreeps`
- Some classes: `ActiveCreep` vs `RangedJob`

**Impact:** Low
**Suggestion:** Establish and document naming conventions:
- PascalCase for classes
- camelCase for variables/methods
- UPPER_SNAKE_CASE for constants

#### 9.2 Inconsistent Comment Style
**Problem:** Mix of comment styles:
- Some files use `//` for section headers
- Others use multi-line comments
- Some have detailed explanations, others minimal

**Impact:** Low
**Suggestion:** Standardize on JSDoc for documentation comments and `//` for inline notes.

#### 9.3 Inconsistent Error Messages
**Problem:** Console logs have varying formats:
- Some: `"Warning: Unknown job type '${jobName}'"`
- Others: `"spawning creep undefined"`
- Some: ``Miner ${this.id} arrived at mining position``

**Impact:** Low
**Suggestion:** Create logging utility with consistent format:
```javascript
Logger.warn('JOB_UNKNOWN', { jobName });
Logger.debug('MINER_POSITIONED', { minerId: this.id });
```

#### 9.4 Mixed Use of String Literals
**Problem:** Job names as string literals throughout:
- `'fighter'`, `'archer'`, `'hauler'` used directly
- Risk of typos

**Impact:** Low
**Suggestion:** Use constants:
```javascript
const JobTypes = {
  FIGHTER: 'fighter',
  ARCHER: 'archer',
  HAULER: 'hauler',
  MINER: 'miner',
  CLERIC: 'cleric'
};
```

---

## 10. Dead Code and Technical Debt

### Issues:

#### 10.1 Commented-Out Code
**Problem:** Several instances of commented code:
- `HaulerJob.mjs` line 139: Road building commented out
- `HaulerJob.mjs` line 126: Miner check commented out
- `MinerJob.mjs` lines 265-272: Alternative extension creation commented out

**Impact:** Medium
**Suggestion:** Remove old code or document why it's preserved. Use git history if needed.

#### 10.2 Unused Imports
**Problem:** Some imports may not be used:
- Need to verify each import is actually used
- Example: `RESOURCE_ENERGY` imported many places, might use `game/constants` barrel import instead

**Impact:** Low
**Suggestion:** Run a linter to detect unused imports.

#### 10.3 Unused Index File
**Problem:** `creep_jobs/index.mjs` exports all classes but is never imported anywhere.
- Main code imports from `JobRegistry.mjs` instead

**Impact:** Low
**Suggestion:** Either use the barrel export or remove it to reduce confusion.

#### 10.4 FighterJob May Be Obsolete
**Problem:** `FighterJob` is defined but never appears in `INITIAL_BUILD_ORDER` or adaptive builds:
- Only archer, cleric, hauler, miner are used in `BuildOrder.mjs`
- FighterJob exists but may be deprecated

**Impact:** Low
**Suggestion:** Either integrate into build order or remove if obsolete. Document decision.

---

## Summary and Prioritization

### High Priority (Refactoring Would Significantly Improve Codebase):
1. **Split BuildOrder class** (Section 2.1) - Too many responsibilities
2. **Extract movement logic from RangedJob** (Section 2.2) - Complex and reusable
3. **Simplify MinerJob** (Section 2.3) - Too many concerns
5. **Implement game state caching** (Section 3.1, 8.1) - Performance and code clarity

### Medium Priority (Would Improve Maintainability):
1. **Reorganize file structure** (Section 1.1) - Better navigation
2. **Extract combat targeting logic** (Section 3.3) - DRY principle
3. **Centralize magic numbers** (Section 4) - Easier tuning
4. **Implement Strategy pattern for builds** (Section 5.1) - More extensible
5. **Add architecture documentation** (Section 7.1) - Onboarding and understanding
6. **Add error handling** (Section 6.1) - Robustness

### Low Priority (Nice to Have):
1. **Optimize position checking** (Section 8.2) - Performance
2. **Standardize code style** (Section 9) - Consistency
3. **Add configuration guide** (Section 8.3) - User experience
4. **Remove dead code** (Section 10) - Cleanliness

### Technical Debt Score
Based on analysis:
- **Code Complexity**: Medium-High (some files >300 lines with multiple responsibilities)
- **Test Coverage**: None (0%)
- **Documentation**: Low-Medium (some good docs, but gaps)
- **Maintainability**: Medium (structure is okay but could be better organized)
- **Extensibility**: Medium (adding new features requires touching multiple files)

### Positive Aspects to Preserve:
1. **Good abstraction with ActiveCreep base class** - Keep this pattern
2. **Well-documented strengthEstimator** - This is a model for other modules
3. **Clear job registry system** - Simple and effective
4. **Separation of jobs directory** - Good organizational start
5. **Use of ES6 modules** - Modern approach

