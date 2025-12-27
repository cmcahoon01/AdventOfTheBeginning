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
    
    // If there are no enemies at all, idle
    if (allHostileCreeps.length === 0) {
        idle(creep);
        return;
    }
    
    // Get all ramparts
    const ramparts = getObjectsByPrototype(StructureRampart);
    
    // Create a Set of rampart positions for O(1) lookup
    const rampartPositions = new Set(ramparts.map(r => `${r.x},${r.y}`));
    
    // Separate enemies into those on ramparts and those not on ramparts
    const enemiesNotOnRamparts = [];
    const enemiesOnRamparts = [];
    
    allHostileCreeps.forEach(enemy => {
        const onRampart = rampartPositions.has(`${enemy.x},${enemy.y}`);
        if (onRampart) {
            enemiesOnRamparts.push(enemy);
        } else {
            enemiesNotOnRamparts.push(enemy);
        }
    });
    
    let target = null;
    
    // First priority: Attack enemies NOT on ramparts
    if (enemiesNotOnRamparts.length > 0) {
        target = creep.findClosestByRange(enemiesNotOnRamparts);
    } 
    // Second priority: If all enemies are on ramparts, check if they're reachable
    else if (enemiesOnRamparts.length > 0) {
        // Find the closest enemy on a rampart
        const closestEnemyOnRampart = creep.findClosestByRange(enemiesOnRamparts);
        
        // Check if the enemy is reachable (i.e., can we get adjacent to them?)
        // An enemy is unreachable if they are completely surrounded by ramparts
        if (isReachableForMelee(closestEnemyOnRampart, ramparts)) {
            target = closestEnemyOnRampart;
        } else {
            // Enemy is unreachable, use idle action
            idle(creep);
            return;
        }
    }
    
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

// Helper function to check if an enemy on a rampart is reachable for melee attack
// An enemy is reachable if at least one adjacent tile is NOT occupied by a rampart
function isReachableForMelee(enemy, ramparts) {
    // Create a Set of rampart positions for O(1) lookup
    const rampartPositions = new Set(ramparts.map(r => `${r.x},${r.y}`));
    
    // Check all 8 adjacent positions around the enemy
    const adjacentPositions = [
        {x: enemy.x - 1, y: enemy.y - 1}, // top-left
        {x: enemy.x, y: enemy.y - 1},     // top
        {x: enemy.x + 1, y: enemy.y - 1}, // top-right
        {x: enemy.x - 1, y: enemy.y},     // left
        {x: enemy.x + 1, y: enemy.y},     // right
        {x: enemy.x - 1, y: enemy.y + 1}, // bottom-left
        {x: enemy.x, y: enemy.y + 1},     // bottom
        {x: enemy.x + 1, y: enemy.y + 1}  // bottom-right
    ];
    
    // If at least one adjacent position doesn't have a rampart, the enemy is reachable
    return adjacentPositions.some(pos => {
        return !rampartPositions.has(`${pos.x},${pos.y}`);
    });
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
            // Find ramparts that are on the edge (don't have ramparts in all 8 adjacent positions)
            const edgeRamparts = ramparts.filter(rampart => {
                // Check all 8 adjacent positions
                const adjacentPositions = [
                    {x: rampart.x - 1, y: rampart.y - 1}, // top-left
                    {x: rampart.x, y: rampart.y - 1},     // top
                    {x: rampart.x + 1, y: rampart.y - 1}, // top-right
                    {x: rampart.x - 1, y: rampart.y},     // left
                    {x: rampart.x + 1, y: rampart.y},     // right
                    {x: rampart.x - 1, y: rampart.y + 1}, // bottom-left
                    {x: rampart.x, y: rampart.y + 1},     // bottom
                    {x: rampart.x + 1, y: rampart.y + 1}  // bottom-right
                ];
                
                // Check if at least one adjacent position doesn't have a rampart
                const hasEmptyAdjacent = adjacentPositions.some(pos => {
                    return !ramparts.some(r => r.x === pos.x && r.y === pos.y);
                });
                
                return hasEmptyAdjacent;
            });
            
            if (edgeRamparts.length > 0) {
                // Find the edge rampart closest to the enemy spawn
                const targetRampart = enemySpawn.findClosestByRange(edgeRamparts);
                
                if (targetRampart) {
                    const rampartAttackResult = creep.attack(targetRampart);
                    if (rampartAttackResult === ERR_NOT_IN_RANGE) {
                        // Move towards the rampart to attack it
                        creep.moveTo(targetRampart);
                    }
                    return;
                }
            }
        }
        
        // No ramparts or can't find one, just move towards spawn
        creep.moveTo(enemySpawn);
    }
}
