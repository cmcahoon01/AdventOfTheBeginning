import { getObjectById, getObjectsByPrototype, findPath, getTerrainAt } from 'game/utils';
import { WORK, CARRY, MOVE, ERR_NOT_IN_RANGE, RESOURCE_ENERGY } from 'game/constants';
import { Source, StructureSpawn, StructureRoad, ConstructionSite } from 'game/prototypes';
import { createConstructionSite } from 'game';
import { Job } from './Job.mjs';

const MAX_ROAD_CONSTRUCTION = 6;

// Hauler job - resource gathering and construction
export class HaulerJob extends Job {
    static get BODY() {
        return [WORK, CARRY, MOVE, MOVE];
    }

    static get COST() {
        return 250; // 100 + 50 + 50 + 50
    }

    static get JOB_NAME() {
        return 'hauler';
    }

    // Helper function to get the next position the creep will move to
    getNextMovePosition(creep, target) {
        // Find the path to the target
        const path = findPath(creep, target);
        
        // If there's a path, return the first step
        if (path && path.length > 0) {
            return path[0];
        }
        
        return null;
    }

    // Helper function to deliver resources to spawn
    deliverToSpawn(creep) {
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        if (spawn) {
            const transferResult = creep.transfer(spawn, RESOURCE_ENERGY);
            if (transferResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn);
            }
        }
    }

    act(creepInfo, controller, winObjective) {
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
                    const constructionSites = getObjectsByPrototype(ConstructionSite);
                    const roadConstructionSites = constructionSites.filter(site =>
                        site.structure instanceof StructureRoad);
                    const roadUnder = roadConstructionSites.find(site => 
                            Math.max(Math.abs(site.x-creep.x), Math.abs(site.y-creep.y)) <= 1);
                    if (roadUnder && creep.store[RESOURCE_ENERGY] >= 10){
                        creep.build(roadUnder);
                    }
                    if (creep.store[RESOURCE_ENERGY] >= 5) {
                        // Get the next position we'll move to
                        const nextPos = this.getNextMovePosition(creep, target);
                        
                        if (nextPos && creep.store[RESOURCE_ENERGY] >= 5) {
                            const roads =  getObjectsByPrototype(StructureRoad);
                            const roadThereAlready = roads.find(site => 
                                site.x === nextPos.x && site.y === nextPos.y);
                            const siteThereAlready = roadConstructionSites.find(site =>
                                site.x === nextPos.x && site.y === nextPos.y);
                            if (!roadThereAlready && !siteThereAlready && roads.length < MAX_ROAD_CONSTRUCTION){
                                createConstructionSite(nextPos, StructureRoad);
                            }
                        }
                    }

                    if (creep.store[RESOURCE_ENERGY] < 5) { 
                        creepInfo.memory.state = 'mining';
                        return;
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
                this.deliverToSpawn(creep);
            }
        }
    }
}

// Export singleton instance and constants for backwards compatibility
export const haulerJob = new HaulerJob();
export const HAULER_BODY = HaulerJob.BODY;
export const HAULER_COST = HaulerJob.COST;

// Backwards compatibility for act_hauler function
export function act_hauler(creepInfo, controller, winObjective) {
    haulerJob.act(creepInfo, controller, winObjective);
}
