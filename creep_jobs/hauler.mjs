import { getObjectById, getObjectsByPrototype } from 'game/utils';
import { WORK, CARRY, MOVE, ERR_NOT_IN_RANGE, RESOURCE_ENERGY } from 'game/constants';
import { Source, ConstructionSite, StructureSpawn, Creep } from 'game/prototypes';

// Body configuration for hauler creeps
export const HAULER_BODY = [WORK, CARRY, MOVE, MOVE];
export const HAULER_COST = 250; // 100 + 50 + 50 + 50

// Heuristic to identify miner creeps (miners have 4 WORK parts)
const MINER_WORK_PARTS_THRESHOLD = 4;

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

export function act_hauler(creepInfo) {
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

        // Check if there are any miner creeps
        const allCreeps = getObjectsByPrototype(Creep).filter(c => c.my);
        const hasMinerCreeps = allCreeps.some(c => {
            // We need to check if any creep is a miner
            // Since we can't access the controller from here, we'll use a heuristic:
            // Miners have more WORK parts than haulers (4 vs 1)
            const workParts = c.body.filter(part => part.type === WORK).length;
            return workParts >= MINER_WORK_PARTS_THRESHOLD && c.id !== creep.id;
        });

        if (hasMinerCreeps) {
            // Deliver to construction site if miners exist
            const constructionSites = getObjectsByPrototype(ConstructionSite).filter(site => site.my);
            if (constructionSites.length > 0) {
                const target = creep.findClosestByRange(constructionSites);
                
                if (target) {
                    const buildResult = creep.build(target);
                    if (buildResult === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                }
            } else {
                // No construction sites, deliver to spawn instead
                deliverToSpawn(creep);
            }
        } else {
            // No miners, deliver to spawn
            deliverToSpawn(creep);
        }
    }
}
