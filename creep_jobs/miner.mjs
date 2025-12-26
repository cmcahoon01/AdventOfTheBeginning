import { getObjectById } from 'game/utils';
import { WORK, CARRY, MOVE } from 'game/constants';

// Body configuration for miner creeps
export const MINER_BODY = [WORK, WORK, WORK, WORK, CARRY, MOVE];
export const MINER_COST = 500; // 100 + 100 + 100 + 100 + 50 + 50

export function act_miner(creepInfo) {
    // TODO: Implement miner logic
    const creep = getObjectById(creepInfo.id);
    if (creep) {
        console.log(`Miner ${creepInfo.id} acting`);
    }
}
