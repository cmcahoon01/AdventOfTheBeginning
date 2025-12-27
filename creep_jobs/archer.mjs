import { getObjectById, getObjectsByPrototype, getRange } from 'game/utils';
import { RANGED_ATTACK, MOVE, ERR_NOT_IN_RANGE } from 'game/constants';
import { Creep, StructureSpawn, StructureRampart } from 'game/prototypes';

// Body configuration for archer creeps
export const ARCHER_BODY = [MOVE, RANGED_ATTACK];
export const ARCHER_COST = 200; // 50 + 150

// Kiting behavior constants
const DESIRED_RANGE = 3;
const RETREAT_DISTANCE = 2;

export function act_archer(creepInfo, controller, winObjective) {
    const creep = getObjectById(creepInfo.id);
    if (!creep) {
        return;
    }

    // Find all enemy creeps
    const allHostileCreeps = getObjectsByPrototype(Creep).filter(i => !i.my);
    
    // If there are no enemies at all, idle
    if (allHostileCreeps.length === 0) {
        idle(creep);
        return;
    }
    
    // Get all ramparts
    const ramparts = getObjectsByPrototype(StructureRampart);
    
    // Separate enemies into those on ramparts and those not on ramparts
    const enemiesNotOnRamparts = [];
    const enemiesOnRamparts = [];
    
    allHostileCreeps.forEach(enemy => {
        const onRampart = ramparts.some(rampart => 
            rampart.x === enemy.x && rampart.y === enemy.y
        );
        if (onRampart) {
            enemiesOnRamparts.push(enemy);
        } else {
            enemiesNotOnRamparts.push(enemy);
        }
    });
    
    let closestEnemy = null;
    
    // First priority: Target enemies NOT on ramparts
    if (enemiesNotOnRamparts.length > 0) {
        closestEnemy = creep.findClosestByRange(enemiesNotOnRamparts);
    } 
    // Second priority: If all enemies are on ramparts, archers can still shoot them
    else if (enemiesOnRamparts.length > 0) {
        closestEnemy = creep.findClosestByRange(enemiesOnRamparts);
    }
    
    if (closestEnemy) {
        const range = getRange(creep, closestEnemy);
        
        // If enemy is too close (within range 3), move away first then attack
        if (range < DESIRED_RANGE) {
            // Calculate direction away from enemy
            const dx = creep.x - closestEnemy.x;
            const dy = creep.y - closestEnemy.y;
            
            // Move away from the enemy (move towards a position further away)
            const targetPos = {
                x: creep.x + Math.sign(dx) * RETREAT_DISTANCE,
                y: creep.y + Math.sign(dy) * RETREAT_DISTANCE
            };
            
            creep.moveTo(targetPos);
            
            // After moving away, attack the enemy (both happen in same tick)
            // The rangedAttack uses current position before movement completes
            creep.rangedAttack(closestEnemy);
        } else if (range > DESIRED_RANGE) {
            // If enemy is too far, move closer
            creep.moveTo(closestEnemy);
            // Also attack if we're within ranged attack range (3)
            if (range <= 3) {
                creep.rangedAttack(closestEnemy);
            }
        } else {
            // At exactly range 3, attack without moving
            creep.rangedAttack(closestEnemy);
        }
    } else {
        idle(creep);
    }
}

function idle(creep) {
    const enemySpawn = getObjectsByPrototype(StructureSpawn).find(i => !i.my);
    if (enemySpawn) {
        // Move towards the enemy spawn
        const range = getRange(creep, enemySpawn);
        
        // Attack the enemy spawn if in range
        if (range <= 3) {
            creep.rangedAttack(enemySpawn);
        } else {
            // Move closer if not in range
            creep.moveTo(enemySpawn);
        }
    }
}
