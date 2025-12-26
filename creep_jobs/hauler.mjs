import { getObjectById, getObjectsByPrototype } from 'game/utils';
import { WORK, CARRY, MOVE, ERR_NOT_IN_RANGE, RESOURCE_ENERGY } from 'game/constants';
import { Source, StructureSpawn } from 'game/prototypes';

// Body configuration for hauler creeps
export const HAULER_BODY = [WORK, CARRY, MOVE, MOVE];
export const HAULER_COST = 250; // 100 + 50 + 50 + 50

// Helper function to deliver resources to spawn
function deliverToSpawn(creep) {
    const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
    if (spawn) {
        const transferResult = creep.transfer(spawn, RESOURCE_ENERGY);
        if (transferResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn);
        }
    }
}

export function act_hauler(creepInfo, controller, winObjective) {
    const creep = getObjectById(creepInfo.id);
    if (!creep) {
        return;
    }

    // Initialize state if not set
    if (!creepInfo.memory.state) {
        creepInfo.memory.state = 'mining';
    }

    // Get current carry capacity and amount
    const usedCapacity = creep.store[RESOURCE_ENERGY] || 0;
    const totalCapacity = creep.store.getCapacity(RESOURCE_ENERGY);

    // State machine logic
    if (creepInfo.memory.state === 'mining') {
        // Check if we're at capacity
        if (usedCapacity >= totalCapacity) {
            creepInfo.memory.state = 'hauling';
            return;
        }

        // Find the closest source
        const sources = getObjectsByPrototype(Source);
        const closestSource = creep.findClosestByRange(sources);

        if (closestSource) {
            // Try to harvest
            const harvestResult = creep.harvest(closestSource);
            
            // If not in range, move towards the source
            if (harvestResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(closestSource);
            }
        }
    } else if (creepInfo.memory.state === 'hauling') {
        // Check if we're empty
        if (usedCapacity === 0) {
            creepInfo.memory.state = 'mining';
            return;
        }

        // Check if there are any miner creeps by accessing the controller
        const hasMinerCreeps = controller.creeps.some(c => c.job === 'miner');

        if (hasMinerCreeps) {
            // Deliver to the specific construction site (winObjective) if miners exist
            if (winObjective) {
                const buildResult = creep.build(winObjective);
                if (buildResult === ERR_NOT_IN_RANGE) {
                    creep.moveTo(winObjective);
                }
            } else {
                // No construction site, deliver to spawn instead
                deliverToSpawn(creep);
            }
        } else {
            // No miners, deliver to spawn
            deliverToSpawn(creep);
        }
    }
}
