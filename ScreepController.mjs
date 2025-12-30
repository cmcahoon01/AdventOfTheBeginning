import { getObjectById } from 'game/utils';
import { JOB_REGISTRY } from './creep_jobs/JobRegistry.mjs';

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
    }

    // Add a new creep to the controller
    addCreep(id, job) {
        if (!JOB_REGISTRY[job]) {
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
            
            // If creep has does not exist it's dead - remove it
            if (!creep || !creep.exists) {
                console.log(`Removing dead creep ${creepInfo.id}`);
                return false;
            }
            
            // Creep is alive, call its action function
            // Skip if creep is still spawning
            if (!creep.spawning) {
                const jobInstance = JOB_REGISTRY[creepInfo.job];
                if (jobInstance) {
                    jobInstance.act(creepInfo, this, winObjective);
                }
            }
            
            return true;
        });
    }
}
