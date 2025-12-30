import { getObjectById, getObjectsByPrototype } from 'game/utils';
import { ATTACK, MOVE, ERR_NOT_IN_RANGE} from 'game/constants';
import { Creep, StructureSpawn, StructureRampart } from 'game/prototypes';
import { ActiveCreep } from './ActiveCreep.mjs';

// Fighter job - melee combat
export class FighterJob extends ActiveCreep {
    static get BODY() {
        return [MOVE, ATTACK];
    }

    static get COST() {
        return 130; // 50 + 80
    }

    static get JOB_NAME() {
        return 'fighter';
    }

    act(controller, winObjective) {
        const creep = getObjectById(this.id);
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
            this.idle(creep);
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
            this.idle(creep);
        }
    }

    idle(creep) {
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
}
