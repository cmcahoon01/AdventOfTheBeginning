import { getObjectById } from 'game/utils';

// Class to store information about a creep
class CreepInfo {
    constructor(id, job) {
        this.id = id;
        this.job = job;
    }
}

// Placeholder action functions for each job
function act_fighter(id) {
    // TODO: Implement fighter logic
    const creep = getObjectById(id);
    if (creep) {
        console.log(`Fighter ${id} acting`);
    }
}

function act_hauler(id) {
    // TODO: Implement hauler logic
    const creep = getObjectById(id);
    if (creep) {
        console.log(`Hauler ${id} acting`);
    }
}

function act_miner(id) {
    // TODO: Implement miner logic
    const creep = getObjectById(id);
    if (creep) {
        console.log(`Miner ${id} acting`);
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
    updateCreeps() {
        // Filter out dead creeps and keep alive ones
        this.creeps = this.creeps.filter(creepInfo => {
            const creep = getObjectById(creepInfo.id);
            
            // If creep is dead/doesn't exist, remove from memory
            if (!creep) {
                console.log(`Removing dead creep ${creepInfo.id}`);
                return false;
            }
            
            // Creep is alive, call its action function
            const actionFn = this.jobActions[creepInfo.job];
            if (actionFn) {
                actionFn(creepInfo.id);
            }
            
            return true;
        });
    }
}
