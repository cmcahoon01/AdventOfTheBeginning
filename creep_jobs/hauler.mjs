import { getObjectById } from 'game/utils';

export function act_hauler(id) {
    // TODO: Implement hauler logic
    const creep = getObjectById(id);
    if (creep) {
        console.log(`Hauler ${id} acting`);
    }
}
