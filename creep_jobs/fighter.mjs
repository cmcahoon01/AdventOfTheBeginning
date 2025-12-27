import { getObjectById, getObjectsByPrototype } from 'game/utils';
import { TOUGH, ATTACK, MOVE, ERR_NOT_IN_RANGE} from 'game/constants';
import { Creep, StructureSpawn } from 'game/prototypes';

// Body configuration for fighter creeps
export const FIGHTER_BODY = [MOVE, MOVE, ATTACK, ATTACK];
export const FIGHTER_COST = 260; // 50 + 50 + 80 + 80

export function act_fighter(creepInfo, controller, winObjective) {
    const creep = getObjectById(creepInfo.id);
    if (!creep) {
        return;
    }

    // Find all enemy creeps
    const hostileCreeps = getObjectsByPrototype(Creep).filter(i => !i.my);
    
    // If there are no enemies, do nothing
    if (hostileCreeps.length === 0) {
        idle(creep);
        return;
    }

    // Find the closest enemy creep
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
    creep.moveTo(enemySpawn);
}
