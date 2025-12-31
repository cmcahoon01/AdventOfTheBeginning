import { getObjectById } from 'game/utils';
import { ATTACK, MOVE, ERR_NOT_IN_RANGE} from 'game/constants';
import { Creep, StructureSpawn, StructureRampart } from 'game/prototypes';
import { ActiveCreep } from './ActiveCreep.mjs';
import { CombatUtils } from '../utils/CombatUtils.mjs';
import { BodyPartCalculator, MapTopology } from '../constants.mjs';

// Fighter job - melee combat
export class FighterJob extends ActiveCreep {
    static get BODY() {
        return [MOVE, ATTACK];
    }

    static get COST() {
        return BodyPartCalculator.calculateCost(this.BODY);
    }

    static get JOB_NAME() {
        return 'fighter';
    }

    act() {
        const creep = getObjectById(this.id);
        if (!creep) {
            return;
        }

        // === DEFENSIVE POSTURING CHECK ===
        const shouldRetreat = CombatUtils.shouldAdoptDefensivePosture(this.gameState);
        
        if (shouldRetreat) {
            // Move to ramparts for defense
            const defensiveRampart = CombatUtils.findDefensiveRampartPosition(creep, this.gameState);
            if (defensiveRampart) {
                // Check if we're already on a rampart
                const onRampart = defensiveRampart.x === creep.x && defensiveRampart.y === creep.y;
                
                if (!onRampart) {
                    // Move to the defensive rampart
                    creep.moveTo(defensiveRampart);
                }
                // If already on rampart, stay there and continue with normal actions
            }
            
            // Still attack enemies if they're in range (even while on ramparts)
            const allHostileCreeps = this.gameState.getEnemyCreeps();
            if (allHostileCreeps.length > 0) {
                const closestEnemy = creep.findClosestByRange(allHostileCreeps);
                if (closestEnemy) {
                    const attackResult = creep.attack(closestEnemy);
                    // No need to move - we stay on ramparts
                }
            }
            
            return;
        }

        // Find all enemy creeps
        const allHostileCreeps = this.gameState.getEnemyCreeps();
        
        // Get all ramparts
        const ramparts = this.gameState.getRamparts();
        
        // Filter out enemies that are standing on ramparts
        const hostileCreeps = CombatUtils.filterMeleeTargetableEnemies(allHostileCreeps, ramparts);
        
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
        const enemySpawn = this.gameState.getEnemySpawn();
        if (!enemySpawn) {
            return;
        }
        
        // Check if we're in enemy's third of the map - if so, move out
        if (CombatUtils.isInEnemyThird(creep, enemySpawn)) {
            // Move towards our spawn (away from enemy third)
            const mySpawn = this.gameState.getMySpawn();
            if (mySpawn) {
                creep.moveTo(mySpawn);
            }
        } else {
            // Idle in the center 2/3rds of the map
            // Stay roughly where we are or move towards center line
            const mapSize = MapTopology.ARENA_SIZE;
            const centerPos = {
                x: mapSize / 2,
                y: mapSize / 2
            };
            
            // Only move if we're far from center (to avoid constant movement)
            const distToCenter = Math.abs(creep.x - centerPos.x) + Math.abs(creep.y - centerPos.y);
            if (distToCenter > mapSize / 4) {
                creep.moveTo(centerPos);
            }
        }
    }
}
