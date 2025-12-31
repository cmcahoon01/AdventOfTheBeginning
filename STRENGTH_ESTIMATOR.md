# Strength Estimator

This module provides functions to estimate the combat strength of creeps and teams in Screeps Arena.

## Overview

The strength estimator uses a heuristic-based approach to calculate combat effectiveness based on body parts:
- **ATTACK**: 30 damage per hit (melee range)
- **RANGED_ATTACK**: 10 damage per hit (range 1-3) 
- **HEAL**: 12 healing per tick (range 1), 4 healing per tick (range 2-3)

## Usage

### Import the module

```javascript
import { 
    calculateCreepStrength, 
    calculateTeamStrength,
    getMyTeamStrength,
    getEnemyTeamStrength,
    compareTeamStrengths,
    getCreepBreakdown
} from './strengthEstimator.mjs';
```

### Calculate individual creep strength

```javascript
// Get a specific creep
const myCreep = getObjectById('creepId');

// Calculate its combat strength
const strength = calculateCreepStrength(myCreep);
console.log(`Creep strength: ${strength}`);
```

### Calculate team strength

```javascript
// Get all friendly creeps
const myCreeps = getObjectsByPrototype(Creep).filter(c => c.my);

// Calculate total team strength
const totalStrength = calculateTeamStrength(myCreeps);
console.log(`Team strength: ${totalStrength}`);
```

### Quick team strength helpers

```javascript
// Get your team's strength
const myTeam = getMyTeamStrength();
console.log(`My team: ${myTeam.count} creeps, strength: ${myTeam.strength}`);

// Get enemy team's strength
const enemyTeam = getEnemyTeamStrength();
console.log(`Enemy team: ${enemyTeam.count} creeps, strength: ${enemyTeam.strength}`);
```

### Compare teams

```javascript
// Compare both teams and get a detailed assessment
const comparison = compareTeamStrengths();

console.log(`My team strength: ${comparison.myTeam.strength}`);
console.log(`Enemy team strength: ${comparison.enemyTeam.strength}`);
console.log(`Advantage: ${comparison.advantage}`);
console.log(`Ratio: ${comparison.ratio.toFixed(2)}:1`);
console.log(`Assessment: ${comparison.assessment}`); // 'favorable', 'unfavorable', or 'even'
```

### Get detailed creep breakdown

```javascript
// Get detailed analysis of a creep
const breakdown = getCreepBreakdown(myCreep);
console.log(`Creep type: ${breakdown.type}`);
console.log(`ATTACK parts: ${breakdown.attack}`);
console.log(`RANGED_ATTACK parts: ${breakdown.rangedAttack}`);
console.log(`HEAL parts: ${breakdown.heal}`);
console.log(`Total strength: ${breakdown.strength}`);
```

## Heuristic Rules

The strength calculator is based on observed combat dynamics:

1. **Ranged Advantage**: Units with RANGED_ATTACK can kite melee units, making them ~3x more effective
   - 1 RANGED_ATTACK can beat up to 3 ATTACK units by maintaining distance

2. **Healing with Ranged**: Healing is very effective with ranged combat (2x multiplier)
   - 1 RANGED_ATTACK + 1 HEAL ≈ 2 RANGED_ATTACK units

3. **Healing with Melee**: Healing is less effective in melee combat (0.5x multiplier)
   - 2 ATTACK units beat 1 ATTACK + 1 HEAL unit

## Combat Value Formula

```
For Ranged Units:
  strength = (RANGED_ATTACK_parts × 10 × 3) + (HEAL_parts × 12 × 2.0)

For Melee Units:
  strength = (ATTACK_parts × 30) + (HEAL_parts × 12 × 0.5)

For Support Units (only HEAL):
  strength = HEAL_parts × 12 × 0.25
```

## Example Strength Values

| Unit Composition | Strength | Type |
|-----------------|----------|------|
| 1 ATTACK | 30 | Melee |
| 1 RANGED_ATTACK | 30 | Ranged |
| 1 RANGED_ATTACK + 1 HEAL | 54 | Ranged Support |
| 2 ATTACK | 60 | Heavy Melee |
| 1 ATTACK + 1 HEAL | 36 | Melee Support |
| 2 RANGED_ATTACK | 60 | Heavy Ranged |

## Integration Example

Use in your main game loop to make tactical decisions:

```javascript
import { compareTeamStrengths } from './strengthEstimator.mjs';

export function loop() {
    // Check team strength before engaging
    const comparison = compareTeamStrengths();
    
    if (comparison.assessment === 'favorable' && comparison.ratio > 1.5) {
        console.log('We have significant advantage - push aggressively!');
        // Implement aggressive tactics
    } else if (comparison.assessment === 'unfavorable') {
        console.log('Enemy has advantage - defensive posture');
        // Implement defensive tactics or retreat
    } else {
        console.log('Teams evenly matched - careful engagement');
        // Implement balanced tactics
    }
    
    // Rest of game loop...
}
```
