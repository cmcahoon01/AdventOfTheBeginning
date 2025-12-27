import { getObjectById, getObjectsByPrototype } from 'game/utils';
import { TOUGH, ATTACK, MOVE, ERR_NOT_IN_RANGE} from 'game/constants';
import { Creep, StructureSpawn, StructureRampart } from 'game/prototypes';

// Body configuration for fighter creeps
export const FIGHTER_BODY = [MOVE, MOVE, ATTACK, ATTACK];
export const FIGHTER_COST = 260; // 50 + 50 + 80 + 80

export function act_fighter(creepInfo, controller, winObjective) {
    const creep = getObjectById(creepInfo.id);
    if (!creep) {
        return;
    }

    // Find all enemy creeps
    const allHostileCreeps = getObjectsByPrototype(Creep).filter(i => !i.my);
    
    // Get all ramparts
    const ramparts = getObjectsByPrototype(StructureRampart);
    
    // Filter out enemies that are standing on ramparts
    const hostileCreeps = allHostileCreeps.filter(enemy => {
        // Check if any rampart is at the same position as this enemy
        const onRampart = ramparts.some(rampart => 
            rampart.x === enemy.x && rampart.y === enemy.y
        );
        return !onRampart;
    });
    
    // If there are no targetable enemies (all on ramparts or none exist), idle
    if (hostileCreeps.length === 0) {
        idle(creep);
        return;
    }

    // Find the closest enemy creep that is not on a rampart
    const target = creep.findClosestByRange(hostileCreeps);
    
    if (target) {
        // Try to attack the target
        const attackResult = creep.attack(target);
        
        // If the target is not in range, move towards it
        if (attackResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    } else {
        idle(creep);
    }
}

function idle(creep){
    const enemySpawn = getObjectsByPrototype(StructureSpawn).find(i => !i.my);
    if (!enemySpawn) {
        return;
    }
    
    // First priority: Try to attack the enemy spawn directly
    const attackResult = creep.attack(enemySpawn);
    
    if (attackResult === ERR_NOT_IN_RANGE) {
        // Can't reach spawn, check if ramparts are blocking
        const ramparts = getObjectsByPrototype(StructureRampart);
        
        if (ramparts.length > 0) {
            // Find the closest rampart to the fighter to clear the path
            const closestRampart = creep.findClosestByRange(ramparts);
            
            if (closestRampart) {
                const rampartAttackResult = creep.attack(closestRampart);
                if (rampartAttackResult === ERR_NOT_IN_RANGE) {
                    // Move towards the rampart to attack it
                    creep.moveTo(closestRampart);
                }
                return;
            }
        }
        
        // No ramparts or can't find one, just move towards spawn
        creep.moveTo(enemySpawn);
    }
}
