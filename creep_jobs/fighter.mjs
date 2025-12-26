import { getObjectById, getObjectsByPrototype } from 'game/utils';
import { ATTACK, MOVE, ERR_NOT_IN_RANGE } from 'game/constants';
import { Creep } from 'game/prototypes';

// Body configuration for fighter creeps
export const FIGHTER_BODY = [ATTACK, ATTACK, MOVE, MOVE];
export const FIGHTER_COST = 260; // 80 + 80 + 50 + 50

export function act_fighter(creepInfo, controller, winObjective) {
    const creep = getObjectById(creepInfo.id);
    if (!creep) {
        return;
    }

    // Find all enemy creeps
    const hostileCreeps = getObjectsByPrototype(Creep).filter(i => !i.my);
    
    // If there are no enemies, do nothing
    if (hostileCreeps.length === 0) {
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
    }
}
