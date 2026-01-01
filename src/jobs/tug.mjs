import { getObjectById } from 'game/utils';
import { MOVE } from 'game/constants';
import { ActiveCreep } from './ActiveCreep.mjs';
import { BodyPartCalculator } from '../constants.mjs';

// Tug job - helps move creeps that don't have MOVE body parts
export class TugJob extends ActiveCreep {
    static get BODY() {
        return [MOVE];
    }

    static get COST() {
        return BodyPartCalculator.calculateCost(this.BODY);
    }

    static get JOB_NAME() {
        return 'tug';
    }

    act() {
        const creep = getObjectById(this.id);
        if (!creep) {
            return;
        }

        const tugChain = this.gameState.getTugChain();
        
        // If tugChain is empty, wait for a creep to request help
        if (tugChain.length === 0) {
            // Idle - wait for requests
            return;
        }

        // Validate the chain - remove any dead creeps
        const validChain = tugChain.filter(id => {
            const chainCreep = getObjectById(id);
            return chainCreep && chainCreep.exists;
        });
        
        // Update the chain if any creeps were removed
        if (validChain.length !== tugChain.length) {
            this.gameState.setTugChain(validChain);
            
            // If the chain is now empty, nothing to do
            if (validChain.length === 0) {
                return;
            }
        }

        // Check if this tug is already in the chain
        const isInChain = validChain.includes(this.id);
        
        if (!isInChain) {
            // This tug needs to join the chain
            // Move towards the last creep in the chain
            const lastCreepId = validChain[validChain.length - 1];
            const lastCreep = getObjectById(lastCreepId);
            
            if (!lastCreep) {
                // This shouldn't happen after validation, but handle it safely
                return;
            }
            
            // Check if we're adjacent to the last creep
            const distance = Math.max(
                Math.abs(creep.x - lastCreep.x),
                Math.abs(creep.y - lastCreep.y)
            );
            
            if (distance <= 1) {
                // We're adjacent, add ourselves to the chain
                this.gameState.addToTugChain(this.id);
            } else {
                // Move towards the last creep in the chain
                creep.moveTo(lastCreep);
            }
        } else {
            // We're already in the chain, just wait
            // The creep being helped will coordinate the movement using pull() commands
            // We don't need to do anything here
        }
    }
}
