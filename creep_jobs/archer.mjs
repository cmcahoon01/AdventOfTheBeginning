import { getObjectById, getObjectsByPrototype, getRange, getTerrainAt } from 'game/utils';
import { RANGED_ATTACK, MOVE, ERR_NOT_IN_RANGE, TERRAIN_WALL } from 'game/constants';
import { Creep, StructureSpawn, StructureRampart, Structure } from 'game/prototypes';

// Body configuration for archer creeps
export const ARCHER_BODY = [MOVE, RANGED_ATTACK];
export const ARCHER_COST = 200; // 50 + 150

// Kiting behavior constants
const DESIRED_RANGE = 3;

// Helper function to calculate Euclidean distance
function euclideanDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Get all valid adjacent positions that the creep can move to
function getValidAdjacentPositions(creep) {
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
    
    // Get all structures and creeps to check for obstacles
    const allCreeps = getObjectsByPrototype(Creep);
    const allStructures = getObjectsByPrototype(Structure);
    
    for (const offset of adjacentOffsets) {
        const pos = { x: creep.x + offset.x, y: creep.y + offset.y };
        
        // Check if position is within bounds (assuming 100x100 arena)
        if (pos.x < 0 || pos.x >= 100 || pos.y < 0 || pos.y >= 100) {
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
function findBestRetreatPosition(creep, enemies) {
    const validPositions = getValidAdjacentPositions(creep);
    
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
        
        // If enemy is too close (less than range 3) or at exactly range 3, 
        // shoot then step away for better positioning
        if (range <= DESIRED_RANGE) {
            // Attack first
            creep.rangedAttack(closestEnemy);
            
            // Then find best position to retreat to
            const retreatPos = findBestRetreatPosition(creep, allHostileCreeps);
            if (retreatPos) {
                creep.moveTo(retreatPos);
            }
        } else {
            // If enemy is too far, move closer
            creep.moveTo(closestEnemy);
            // Also attack if we're within ranged attack range (3)
            if (range <= 3) {
                creep.rangedAttack(closestEnemy);
            }
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
