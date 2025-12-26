import { getObjectById } from 'game/utils';
import { act_fighter } from './creep_jobs/fighter.mjs';
import { act_hauler } from './creep_jobs/hauler.mjs';
import { act_miner } from './creep_jobs/miner.mjs';

// Class to store information about a creep
class CreepInfo {
    constructor(id, job) {
        this.id = id;
        this.job = job;
        this.memory = {}; // Dictionary to store creep-specific state/memory
    }
}

// Controller class to manage all creeps
export class ScreepController {
    constructor() {
        this.creeps = [];
        // Map job names to their action functions
        this.jobActions = {
            fighter: act_fighter,
            hauler: act_hauler,
            miner: act_miner
        };
    }

    // Add a new creep to the controller
    addCreep(id, job) {
        if (!this.jobActions[job]) {
            console.log(`Warning: Unknown job type '${job}'`);
            return;
        }
        const creepInfo = new CreepInfo(id, job);
        this.creeps.push(creepInfo);
        console.log(`Added creep ${id} with job ${job}`);
    }

    // Update all creeps - remove dead ones and call actions for alive ones
    updateCreeps(winObjective) {
        // Filter out dead creeps and keep alive ones
        this.creeps = this.creeps.filter(creepInfo => {
            const creep = getObjectById(creepInfo.id);
            
            // If creep doesn't exist yet, it might still be spawning - keep it
            if (!creep) {
                return true;
            }
            
            // If creep has 0 hits and is not spawning, it's dead - remove it
            if (!creep.exists) {
                console.log(`Removing dead creep ${creepInfo.id}`);
                return false;
            }
            
            // Creep is alive, call its action function
            // Skip if creep is still spawning
            if (!creep.spawning) {
                const actionFn = this.jobActions[creepInfo.job];
                if (actionFn) {
                    actionFn(creepInfo, this, winObjective);
                }
            }
            
            return true;
        });
    }
}
