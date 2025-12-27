import { getObjectById, getObjectsByPrototype, findPath, getTerrainAt } from 'game/utils';
import { WORK, CARRY, MOVE, ERR_NOT_IN_RANGE, RESOURCE_ENERGY } from 'game/constants';
import { Source, StructureSpawn, StructureRoad, ConstructionSite } from 'game/prototypes';
import { createConstructionSite } from 'game';

// Body configuration for hauler creeps
export const HAULER_BODY = [WORK, CARRY, MOVE, MOVE];
export const HAULER_COST = 250; // 100 + 50 + 50 + 50

// Helper function to get the next position the creep will move to
function getNextMovePosition(creep, target) {
    // Find the path to the target
    const path = findPath(creep, target);
    
    // If there's a path, return the first step
    if (path && path.length > 0) {
        return path[0];
    }
    
    return null;
}

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

        // Find the closest source, excluding corner sources (y < 30 or y > 70)
        // This forces haulers to use the central sources near the middle of the map
        const allSources = getObjectsByPrototype(Source);
        const centralSources = allSources.filter(source => source.y >= 30 && source.y <= 70);
        // Fallback to all sources if no central sources exist
        const sourcesToUse = centralSources.length > 0 ? centralSources : allSources;
        const closestSource = creep.findClosestByRange(sourcesToUse);

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
            // Determine the target (either winObjective or spawn)
            let target = winObjective;
            if (!target) {
                target = getObjectsByPrototype(StructureSpawn).find(s => s.my);
            }
            
            if (target) {
                constructionSites = getObjectsByPrototype(ConstructionSite);
                const roadUnder = constructionSites.find(site => 
                        site.x === creep.x && 
                        site.y === creep.y &&
                        site.structure instanceof StructureRoad
                    );
                if (roadUnder && creep.store[RESOURCE_ENERGY] >= 10){
                    const buildResult = creep.build(constructionResult.object);
                    if (!buildResult.error) {
                        // Get the next position we'll move to
                        const nextPos = getNextMovePosition(creep, target);
                        
                        if (nextPos && creep.store[RESOURCE_ENERGY] >= 10) {
                            createConstructionSite(nextPos, StructureRoad);
                        }
                    }
                }
                
                // Now move towards the target
                // If target is winObjective, also try to build it
                if (winObjective && target === winObjective) {
                    const buildResult = creep.build(winObjective);
                    if (buildResult === ERR_NOT_IN_RANGE) {
                        creep.moveTo(winObjective);
                    }
                } else {
                    // Moving to spawn
                    const transferResult = creep.transfer(target, RESOURCE_ENERGY);
                    if (transferResult === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                }
            }
        } else {
            // No miners, deliver to spawn
            deliverToSpawn(creep);
        }
    }
}
