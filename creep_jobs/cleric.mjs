import { getObjectById, getObjectsByPrototype, getRange, getTerrainAt } from 'game/utils';
import { RANGED_ATTACK, HEAL, MOVE, ERR_NOT_IN_RANGE, TERRAIN_WALL } from 'game/constants';
import { Creep, StructureSpawn, StructureRampart, Structure } from 'game/prototypes';

// Body configuration for cleric creeps
export const CLERIC_BODY = [MOVE, MOVE, RANGED_ATTACK, HEAL];
export const CLERIC_COST = 450; // 50 + 50 + 150 + 250

// Kiting behavior constants
const DESIRED_RANGE = 3;
const ARENA_SIZE = 100; // Arena dimensions

// Helper function to calculate Euclidean distance
function euclideanDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Get all valid adjacent positions that the creep can move to
function getValidAdjacentPositions(creep, allCreeps, allStructures) {
    const adjacentOffsets = [
        { x: 0, y: -1 },   // TOP
        { x: 1, y: -1 },   // TOP_RIGHT
        { x: 1, y: 0 },    // RIGHT
        { x: 1, y: 1 },    // BOTTOM_RIGHT
        { x: 0, y: 1 },    // BOTTOM
        { x: -1, y: 1 },   // BOTTOM_LEFT
        { x: -1, y: 0 },   // LEFT
        { x: -1, y: -1 }   // TOP_LEFT
    ];
    
    const validPositions = [];
    
    for (const offset of adjacentOffsets) {
        const pos = { x: creep.x + offset.x, y: creep.y + offset.y };
        
        // Check if position is within bounds
        if (pos.x < 0 || pos.x >= ARENA_SIZE || pos.y < 0 || pos.y >= ARENA_SIZE) {
            continue;
        }
        
        // Check if position is a wall
        const terrain = getTerrainAt(pos);
        if (terrain === TERRAIN_WALL) {
            continue;
        }
        
        // Check if position is blocked by a creep
        const hasCreep = allCreeps.some(c => c.x === pos.x && c.y === pos.y);
        if (hasCreep) {
            continue;
        }
        
        // Check if position is blocked by an obstacle structure
        const hasObstacle = allStructures.some(s => 
            s.x === pos.x && s.y === pos.y && 
            (s.constructor.name === 'StructureWall' || 
             (s.constructor.name === 'StructureRampart' && !s.my))
        );
        if (hasObstacle) {
            continue;
        }
        
        validPositions.push(pos);
    }
    
    return validPositions;
}

// Find the best retreat position from enemies
function findBestRetreatPosition(creep, enemies, allCreeps, allStructures) {
    // Guard against empty enemies array
    if (enemies.length === 0) {
        return null;
    }
    
    const validPositions = getValidAdjacentPositions(creep, allCreeps, allStructures);
    
    if (validPositions.length === 0) {
        return null; // No valid positions to move to
    }
    
    // Find the closest enemy to each position
    const positionsWithDistances = validPositions.map(pos => {
        const minEnemyDistance = Math.min(...enemies.map(enemy => euclideanDistance(pos, enemy)));
        return { pos, minEnemyDistance };
    });
    
    // Find the maximum distance from enemies
    const maxDistance = Math.max(...positionsWithDistances.map(p => p.minEnemyDistance));
    
    // Filter positions that have maximum distance from enemies
    const bestPositions = positionsWithDistances
        .filter(p => p.minEnemyDistance === maxDistance)
        .map(p => p.pos);
    
    // If only one position, return it
    if (bestPositions.length === 1) {
        return bestPositions[0];
    }
    
    // If multiple positions, pick the one closest to our spawn
    const mySpawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
    if (mySpawn) {
        let closestToSpawn = bestPositions[0];
        let minSpawnDistance = euclideanDistance(closestToSpawn, mySpawn);
        
        for (let i = 1; i < bestPositions.length; i++) {
            const spawnDistance = euclideanDistance(bestPositions[i], mySpawn);
            if (spawnDistance < minSpawnDistance) {
                minSpawnDistance = spawnDistance;
                closestToSpawn = bestPositions[i];
            }
        }
        
        return closestToSpawn;
    }
    
    // Fallback: return the first position
    return bestPositions[0];
}

export function act_cleric(creepInfo, controller, winObjective) {
    const creep = getObjectById(creepInfo.id);
    if (!creep) {
        return;
    }

    // Cache expensive operations once per cleric per tick
    const allCreeps = getObjectsByPrototype(Creep);
    const allStructures = getObjectsByPrototype(Structure);
    
    // Find all enemy creeps
    const allHostileCreeps = allCreeps.filter(i => !i.my);
    const myCreeps = allCreeps.filter(i => i.my);
    
    // Find damaged friendly creeps (including self)
    const damagedCreeps = myCreeps.filter(c => c.hits < c.hitsMax);
    
    // Check if cleric itself is damaged - highest priority for healing
    const selfIsDamaged = creep.hits < creep.hitsMax;
    
    // Determine if there are enemies in range
    const enemiesInRange = allHostileCreeps.filter(e => getRange(creep, e) <= 3);
    
    // === HEALING LOGIC ===
    // Priority 1: Heal self if damaged
    if (selfIsDamaged) {
        creep.heal(creep);
    }
    // Priority 2: Heal other damaged allies in range
    else if (damagedCreeps.length > 0) {
        const closestDamagedAlly = creep.findClosestByRange(damagedCreeps);
        if (closestDamagedAlly && closestDamagedAlly.id !== creep.id) {
            const range = getRange(creep, closestDamagedAlly);
            
            // Healing is more effective at close range
            if (range <= 1) {
                creep.heal(closestDamagedAlly);
            } else if (range <= 3) {
                creep.rangedHeal(closestDamagedAlly);
            }
        }
    }
    
    // === ATTACK LOGIC ===
    if (allHostileCreeps.length > 0) {
        // Get all ramparts for targeting logic
        const ramparts = getObjectsByPrototype(StructureRampart);
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
        
        let closestEnemy = null;
        
        // First priority: Target enemies NOT on ramparts
        if (enemiesNotOnRamparts.length > 0) {
            closestEnemy = creep.findClosestByRange(enemiesNotOnRamparts);
        } 
        // Second priority: If all enemies are on ramparts, clerics can still shoot them
        else if (enemiesOnRamparts.length > 0) {
            closestEnemy = creep.findClosestByRange(enemiesOnRamparts);
        }
        
        if (closestEnemy) {
            const range = getRange(creep, closestEnemy);
            
            // If enemy is in attack range, attack
            if (range <= 3) {
                creep.rangedAttack(closestEnemy);
            }
            
            // === MOVEMENT LOGIC WHEN ENEMIES EXIST ===
            // If there are enemies in range, movement should be dedicated to kiting
            if (enemiesInRange.length > 0) {
                // Kite: move away from enemies
                const retreatPos = findBestRetreatPosition(creep, allHostileCreeps, allCreeps, allStructures);
                if (retreatPos) {
                    creep.moveTo(retreatPos);
                }
            } 
            // No enemies in range - move towards target based on priority
            else {
                // If there are injured allies (excluding self, not in range), move to them first
                const damagedAllies = damagedCreeps.filter(c => c.id !== creep.id);
                if (damagedAllies.length > 0) {
                    const closestDamagedAlly = creep.findClosestByRange(damagedAllies);
                    if (closestDamagedAlly && getRange(creep, closestDamagedAlly) > 1) {
                        creep.moveTo(closestDamagedAlly);
                    }
                }
                // Otherwise move towards enemies to attack
                else if (range > 3) {
                    creep.moveTo(closestEnemy);
                }
            }
        }
    } else {
        // No enemies at all - idle behavior
        idle(creep, damagedCreeps);
    }
}

function idle(creep, damagedCreeps) {
    // If there are injured creeps (excluding self), move to them
    const damagedAllies = damagedCreeps.filter(c => c.id !== creep.id);
    if (damagedAllies.length > 0) {
        const closestDamagedAlly = creep.findClosestByRange(damagedAllies);
        if (closestDamagedAlly) {
            creep.moveTo(closestDamagedAlly);
        }
        return;
    }
    
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
