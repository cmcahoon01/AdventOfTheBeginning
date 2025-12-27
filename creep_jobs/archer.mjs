import { getObjectById, getObjectsByPrototype, getRange } from 'game/utils';
import { RANGED_ATTACK, MOVE, ERR_NOT_IN_RANGE } from 'game/constants';
import { Creep, StructureSpawn } from 'game/prototypes';

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
    const hostileCreeps = getObjectsByPrototype(Creep).filter(i => !i.my);
    
    // If there are no enemies, idle (move towards enemy spawn)
    if (hostileCreeps.length === 0) {
        idle(creep);
        return;
    }

    // Find the closest enemy creep
    const closestEnemy = creep.findClosestByRange(hostileCreeps);
    
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
        creep.moveTo(enemySpawn);
    }
}
