import { getObjectById } from 'game/utils';
import { WORK, CARRY, MOVE } from 'game/constants';

// Body configuration for hauler creeps
export const HAULER_BODY = [WORK, CARRY, MOVE, MOVE];
export const HAULER_COST = 250; // 100 + 50 + 50 + 50

export function act_hauler(id) {
    // TODO: Implement hauler logic
    const creep = getObjectById(id);
    if (creep) {
        console.log(`Hauler ${id} acting`);
    }
}
