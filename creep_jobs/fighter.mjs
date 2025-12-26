import { getObjectById } from 'game/utils';
import { ATTACK, MOVE } from 'game/constants';

// Body configuration for fighter creeps
export const FIGHTER_BODY = [ATTACK, ATTACK, MOVE, MOVE];
export const FIGHTER_COST = 260; // 80 + 80 + 50 + 50

export function act_fighter(id) {
    // TODO: Implement fighter logic
    const creep = getObjectById(id);
    if (creep) {
        console.log(`Fighter ${id} acting`);
    }
}
