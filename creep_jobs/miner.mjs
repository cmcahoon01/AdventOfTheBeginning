import { getObjectById } from 'game/utils';

export function act_miner(id) {
    // TODO: Implement miner logic
    const creep = getObjectById(id);
    if (creep) {
        console.log(`Miner ${id} acting`);
    }
}
