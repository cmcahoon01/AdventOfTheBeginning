import { getObjectById } from 'game/utils';

/**
 * TugChainService - Utility for coordinating movement of tug chains.
 * 
 * A tug chain consists of a creep that needs help (at index 0) followed by 
 * tug creeps. The service coordinates their movement using pull() mechanics.
 */
export class TugChainService {
    /**
     * Move a tug chain towards a target position.
     * 
     * @param {string[]} tugChain - Array of creep IDs, with helped creep at index 0
     * @param {Object} target - Target position or object to move towards
     * @returns {boolean} True if chain movement was executed, false if chain is invalid
     */
    static moveChain(tugChain, target) {
        if (!tugChain || tugChain.length === 0) {
            return false;
        }

        // Get all creeps in the chain
        const creeps = tugChain.map(id => getObjectById(id));
        
        // Validate all creeps exist
        if (creeps.some(creep => !creep || !creep.exists)) {
            return false;
        }

        // Execute the chain movement
        for (let idx = 0; idx < creeps.length; idx++) {
            if (idx === 0) {
                // First creep (the one being helped) moves towards target
                creeps[idx].moveTo(target);
            } else {
                // Subsequent creeps pull and follow
                creeps[idx - 1].pull(creeps[idx]);
                creeps[idx].moveTo(creeps[idx - 1]);
            }
        }

        return true;
    }
}
