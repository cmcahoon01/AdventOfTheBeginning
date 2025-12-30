import { getObjectById, getObjectsByPrototype, getRange, getTerrainAt } from 'game/utils';
import { TERRAIN_WALL, TERRAIN_SWAMP } from 'game/constants';
import { Creep, StructureSpawn, StructureRampart, Structure } from 'game/prototypes';
import { Job } from './Job.mjs';

// Kiting behavior constants
const DESIRED_RANGE = 3;
const ARENA_SIZE = 100; // Arena dimensions

// Base class for ranged combat units (archer and cleric)
export class RangedJob extends Job {
    constructor() {
        super();
        if (new.target === RangedJob) {
            throw new TypeError("Cannot construct RangedJob instances directly");
        }
    }

    // Get all valid adjacent positions that the creep can move to
    getValidAdjacentPositions(creep, allCreeps, allStructures) {
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
    findBestRetreatPosition(creep, enemies, allCreeps, allStructures) {
        // Guard against empty enemies array
        if (enemies.length === 0) {
            return null;
        }
        
        const validPositions = this.getValidAdjacentPositions(creep, allCreeps, allStructures);
        
        if (validPositions.length === 0) {
            return null; // No valid positions to move to
        }
        
        // Find the closest enemy to each position
        const positionsWithDistances = validPositions.map(pos => {
            const minEnemyDistance = Math.min(...enemies.map(enemy => getRange(pos, enemy)));
            return { pos, minEnemyDistance };
        });
        
        // Find the maximum distance from enemies
        const maxDistance = Math.max(...positionsWithDistances.map(p => p.minEnemyDistance));
        
        // Filter positions that have maximum distance from enemies
        let bestPositions = positionsWithDistances
            .filter(p => p.minEnemyDistance === maxDistance)
            .map(p => p.pos);
        
        // If only one position, return it
        if (bestPositions.length === 1) {
            return bestPositions[0];
        }
        
        // If there are ties, avoid stepping on swamp tiles
        const nonSwampPositions = bestPositions.filter(pos => {
            const terrain = getTerrainAt(pos);
            return terrain !== TERRAIN_SWAMP;
        });
        
        // Use non-swamp positions if available, otherwise use all best positions
        if (nonSwampPositions.length > 0) {
            bestPositions = nonSwampPositions;
        }
        
        // If only one position after swamp filtering, return it
        if (bestPositions.length === 1) {
            return bestPositions[0];
        }
        
        // If there are still ties, use the furthest Euclidean distance
        let furthestPosition = bestPositions[0];
        let maxEuclideanDistance = Math.sqrt(
            Math.pow(furthestPosition.x - creep.x, 2) + 
            Math.pow(furthestPosition.y - creep.y, 2)
        );
        
        for (let i = 1; i < bestPositions.length; i++) {
            const euclideanDistance = Math.sqrt(
                Math.pow(bestPositions[i].x - creep.x, 2) + 
                Math.pow(bestPositions[i].y - creep.y, 2)
            );
            
            if (euclideanDistance > maxEuclideanDistance) {
                maxEuclideanDistance = euclideanDistance;
                furthestPosition = bestPositions[i];
            }
        }
        
        return furthestPosition;
    }

    // Idle behavior - move towards enemy spawn
    idle(creep, damagedCreeps) {
        // Subclasses can optionally check for injured allies first
        if (this.shouldHealDuringIdle() && damagedCreeps) {
            const damagedAllies = damagedCreeps.filter(c => c.id !== creep.id);
            if (damagedAllies.length > 0) {
                const closestDamagedAlly = creep.findClosestByRange(damagedAllies);
                if (closestDamagedAlly) {
                    creep.moveTo(closestDamagedAlly);
                }
                return;
            }
        }
        
        const enemySpawn = getObjectsByPrototype(StructureSpawn).find(i => !i.my);
        if (enemySpawn) {
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

    // Hook method for subclasses to indicate if they should heal during idle
    shouldHealDuringIdle() {
        return false;
    }

    // Hook method for subclasses to implement healing logic
    performHealing(creep, damagedCreeps, allCreeps) {
        // Default: no healing
    }

    act(creepInfo, controller, winObjective) {
        const creep = getObjectById(creepInfo.id);
        if (!creep) {
            return;
        }

        // Cache expensive operations once per tick
        const allCreeps = getObjectsByPrototype(Creep);
        const allStructures = getObjectsByPrototype(Structure);
        
        // Find all enemy creeps
        const allHostileCreeps = allCreeps.filter(i => !i.my);
        const myCreeps = allCreeps.filter(i => i.my);
        
        // Find damaged friendly creeps (including self)
        const damagedCreeps = myCreeps.filter(c => c.hits < c.hitsMax);
        
        // Determine if there are enemies in range
        const enemiesInRange = allHostileCreeps.filter(e => getRange(creep, e) <= 3);
        
        // === HEALING LOGIC (if applicable) ===
        this.performHealing(creep, damagedCreeps, allCreeps);
        
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
            // Second priority: If all enemies are on ramparts, ranged units can still shoot them
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
                    const retreatPos = this.findBestRetreatPosition(creep, allHostileCreeps, allCreeps, allStructures);
                    if (retreatPos) {
                        creep.moveTo(retreatPos);
                    }
                } 
                // No enemies in range - move towards target based on priority
                else {
                    // If there are injured allies (excluding self, not in range), move to them first
                    if (this.shouldHealDuringIdle()) {
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
                            if (range == 4) {
                                creep.rangedAttack(closestEnemy);
                            }
                        }
                    } else {
                        // Non-healing units just move towards enemies
                        if (range > 3) {
                            creep.moveTo(closestEnemy);
                            if (range == 4) {
                                creep.rangedAttack(closestEnemy);
                            }
                        }
                    }
                }
            }
        } else {
            // No enemies at all - idle behavior
            this.idle(creep, damagedCreeps);
        }
    }
}
