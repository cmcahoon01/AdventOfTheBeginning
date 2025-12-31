/**
 * Example Integration: Using Strength Estimator in Game Logic
 * 
 * This file demonstrates how the strength estimator can be integrated
 * into the main game loop or specific job classes to make tactical decisions.
 */

import { getObjectsByPrototype } from 'game/utils';
import { ConstructionSite, Creep, Source, StructureSpawn } from 'game/prototypes';
import { CARRY, MOVE, WORK, ERR_NOT_IN_RANGE } from 'game/constants';
import { RESOURCE_ENERGY } from 'game';
import { ScreepController } from './ScreepController.mjs';
import { BuildOrder } from './BuildOrder.mjs';
import { compareTeamStrengths, getMyTeamStrength, getEnemyTeamStrength } from './strengthEstimator.mjs';

const spawn = getObjectsByPrototype(StructureSpawn).find(i => i.my);
const winObjective = getObjectsByPrototype(ConstructionSite).find(i => i.my);
const screepController = new ScreepController();
const buildOrder = new BuildOrder(screepController, winObjective);

// Track when we last logged strength comparison (to avoid spam)
let lastStrengthLogTick = 0;

export function loop() {
    // Check if there's a spawning creep that needs to be added to memory
    buildOrder.checkAndAddSpawningCreep();

    // Try to spawn the next creep in the build order
    buildOrder.trySpawnNextCreep();

    // Use the controller to update all creeps
    screepController.updateCreeps(winObjective);
    
    // ===== STRENGTH ESTIMATOR INTEGRATION =====
    // Log strength comparison every 10 ticks (not every tick to reduce console spam)
    const currentTick = Game.time || 0;
    if (currentTick - lastStrengthLogTick >= 10) {
        const comparison = compareTeamStrengths();
        
        console.log('=== Combat Strength Analysis ===');
        console.log(`My Team: ${comparison.myTeam.count} creeps, strength: ${comparison.myTeam.strength.toFixed(1)}`);
        console.log(`Enemy Team: ${comparison.enemyTeam.count} creeps, strength: ${comparison.enemyTeam.strength.toFixed(1)}`);
        console.log(`Assessment: ${comparison.assessment}`);
        
        if (comparison.ratio !== Infinity) {
            console.log(`Strength Ratio: ${comparison.ratio.toFixed(2)}:1`);
        }
        
        // Strategic decision making based on strength
        if (comparison.assessment === 'favorable' && comparison.ratio > 1.5) {
            console.log('Strategy: Aggressive push - we have significant advantage');
            // Could modify creep behavior here to be more aggressive
        } else if (comparison.assessment === 'unfavorable') {
            console.log('Strategy: Defensive - enemy has advantage');
            // Could modify creep behavior here to be more defensive
        } else {
            console.log('Strategy: Balanced - teams are evenly matched');
        }
        
        lastStrengthLogTick = currentTick;
    }
}

// ===== ALTERNATIVE: Per-Creep Decision Making =====
// Example of how a job class could use strength estimator to make decisions

/**
 * Example: Modified FighterJob that checks strength before engaging
 */
/*
import { calculateCreepStrength, calculateTeamStrength } from './strengthEstimator.mjs';

class SmartFighterJob extends FighterJob {
    act() {
        const creep = getObjectById(this.id);
        if (!creep) return;
        
        // Get nearby enemies
        const nearbyEnemies = getObjectsByPrototype(Creep)
            .filter(c => !c.my && getRange(creep, c) <= 5);
        
        // Get nearby allies
        const nearbyAllies = getObjectsByPrototype(Creep)
            .filter(c => c.my && getRange(creep, c) <= 5);
        
        if (nearbyEnemies.length > 0) {
            // Calculate local strength comparison
            const allyStrength = calculateTeamStrength(nearbyAllies);
            const enemyStrength = calculateTeamStrength(nearbyEnemies);
            
            if (allyStrength > enemyStrength * 1.2) {
                // We have advantage - engage aggressively
                console.log(`Fighter ${creep.id}: Engaging (advantage ${(allyStrength/enemyStrength).toFixed(2)}:1)`);
                super.act(); // Use normal fighter behavior
            } else if (enemyStrength > allyStrength * 1.5) {
                // We're outnumbered - retreat towards spawn
                console.log(`Fighter ${creep.id}: Retreating (disadvantage)`);
                const mySpawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
                if (mySpawn) {
                    creep.moveTo(mySpawn);
                }
            } else {
                // Even match - proceed with caution
                super.act();
            }
        } else {
            // No enemies nearby - normal behavior
            super.act();
        }
    }
}
*/
