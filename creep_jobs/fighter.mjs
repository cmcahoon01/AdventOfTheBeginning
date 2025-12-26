import { getObjectById } from 'game/utils';

export function act_fighter(id) {
    // TODO: Implement fighter logic
    const creep = getObjectById(id);
    if (creep) {
        console.log(`Fighter ${id} acting`);
    }
}
