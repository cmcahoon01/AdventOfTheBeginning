import { getObjectById, getObjectsByPrototype, getRange } from 'game/utils';
import { Creep, StructureSpawn, StructureRampart, Structure } from 'game/prototypes';
import { ActiveCreep } from './ActiveCreep.mjs';
import { KitingBehavior } from '../combat/KitingBehavior.mjs';

// Kiting behavior constants
const DESIRED_RANGE = 3;

// Base class for ranged combat units (archer and cleric)
export class RangedJob extends ActiveCreep {
    constructor(id, jobName, controller, winObjective) {
        super(id, jobName, controller, winObjective);
        if (new.target === RangedJob) {
            throw new TypeError("Cannot construct RangedJob instances directly");
        }
    }

    // Get all valid adjacent positions that the creep can move to
    getValidAdjacentPositions(creep, allCreeps, allStructures) {
        return KitingBehavior.getValidAdjacentPositions(creep, allCreeps, allStructures);
    }

    // Find the nearest enemy to a position
    findNearestEnemy(position, enemies) {
        return KitingBehavior.findNearestEnemy(position, enemies);
    }

    // Find the best retreat position from enemies
    findBestRetreatPosition(creep, enemies, allCreeps, allStructures) {
        return KitingBehavior.findBestRetreatPosition(creep, enemies, allCreeps, allStructures);
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

    act() {
        const creep = getObjectById(this.id);
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
                // if (range <= DESIRED_RANGE) {
                //     creep.rangedAttack(closestEnemy);
                // }
                
                // === MOVEMENT LOGIC WHEN ENEMIES EXIST ===
                // If there are enemies in range, movement should be dedicated to kiting
                if (enemiesInRange.length > 0 && range < DESIRED_RANGE) {
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
                        else if (range > DESIRED_RANGE) {
                            creep.moveTo(closestEnemy);
                        }
                    } else {
                        // Non-healing units just move towards enemies
                        if (range > DESIRED_RANGE) {
                            creep.moveTo(closestEnemy);
                        }
                    }
                }
                creep.rangedAttack(closestEnemy);
            } else {
                console.log(`Creep ${creep.id} could not find a closest enemy despite enemies existing!`);
            }
        } else {
            // No enemies at all - idle behavior
            this.idle(creep, damagedCreeps);
        }
    }
}
