import { getObjectById, getObjectsByPrototype, getRange } from 'game/utils';
import { RANGED_ATTACK, MOVE, ERR_NOT_IN_RANGE } from 'game/constants';
import { Creep, StructureSpawn } from 'game/prototypes';

// Body configuration for archer creeps
export const ARCHER_BODY = [MOVE, RANGED_ATTACK];
export const ARCHER_COST = 200; // 50 + 150

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
        const DESIRED_RANGE = 3;
        
        // If enemy is too close (within range 3), move away first
        if (range < DESIRED_RANGE) {
            // Calculate direction away from enemy
            const dx = creep.x - closestEnemy.x;
            const dy = creep.y - closestEnemy.y;
            
            // Move away from the enemy
            const targetPos = {
                x: creep.x + (dx > 0 ? 1 : dx < 0 ? -1 : 0),
                y: creep.y + (dy > 0 ? 1 : dy < 0 ? -1 : 0)
            };
            
            creep.moveTo(targetPos);
        } else if (range > DESIRED_RANGE) {
            // If enemy is too far, move closer
            creep.moveTo(closestEnemy);
        }
        // If at exactly range 3, don't move
        
        // Always try to attack after moving (or if at correct range)
        // rangedAttack works up to range 3
        if (range <= DESIRED_RANGE) {
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
