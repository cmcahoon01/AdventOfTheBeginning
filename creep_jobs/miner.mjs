import { getObjectById, getObjectsByPrototype, getRange, getTerrainAt } from 'game/utils';
import { WORK, CARRY, MOVE, ERR_NOT_IN_RANGE, RESOURCE_ENERGY, TERRAIN_WALL } from 'game/constants';
import { Source, StructureSpawn, StructureExtension, ConstructionSite } from 'game/prototypes';
import { createConstructionSite } from 'game';

// Body configuration for miner creeps
export const MINER_BODY = [WORK, WORK, WORK, WORK, CARRY, MOVE];
export const MINER_COST = 500; // 100 + 100 + 100 + 100 + 50 + 50

// Number of extensions each miner should create and fill
export const EXTENSIONS_PER_MINER = 1;

// Helper function to find sources sorted by position (top to bottom)
function findSortedSources() {
    const sources = getObjectsByPrototype(Source);
    // Sort by y coordinate (top to bottom)
    return sources.sort((a, b) => a.y - b.y);
}

// Helper function to determine which team side we're on
function getTeamSide() {
    const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
    if (!spawn) return 'left';
    
    // Assuming the map is 100x100, if spawn.x < 50, we're on the left
    return spawn.x < 50 ? 'left' : 'right';
}

// Helper function to assign source to a miner based on miner count
function assignSourceToMiner(minerIndex) {
    const sources = findSortedSources();
    const teamSide = getTeamSide();
    
    if (sources.length < 2) {
        return null; // Not enough sources
    }
    
    // First miner gets top source (corner source based on team side)
    if (minerIndex === 0) {
        // Filter to corner sources (top)
        const topSources = sources.filter(s => s.y < 30);
        if (teamSide === 'left') {
            // Get the leftmost top source
            return topSources.sort((a, b) => a.x - b.x)[0];
        } else {
            // Get the rightmost top source
            return topSources.sort((a, b) => b.x - a.x)[0];
        }
    }
    
    // Second miner gets bottom source
    if (minerIndex === 1) {
        const bottomSources = sources.filter(s => s.y > 70);
        if (teamSide === 'left') {
            // Get the leftmost bottom source
            return bottomSources.sort((a, b) => a.x - b.x)[0];
        } else {
            // Get the rightmost bottom source
            return bottomSources.sort((a, b) => b.x - a.x)[0];
        }
    }
    
    return null;
}

// Helper function to find the position directly adjacent to the source (not diagonal)
// The source is in a wall, so we look for the one non-wall position directly adjacent
function findMiningPosition(source) {
    const teamSide = getTeamSide();
    
    // The mining position should be the one facing towards the center/spawn
    // For corner sources, this is typically towards the center of the map
    const directions = [
        { dx: 0, dy: -1 }, // TOP
        { dx: 1, dy: 0 },  // RIGHT
        { dx: 0, dy: 1 },  // BOTTOM
        { dx: -1, dy: 0 }  // LEFT
    ];
    
    // Determine the best direction based on source position
    // If source is in top left corner (x < 50, y < 50), we want RIGHT or BOTTOM
    // If source is in top right corner (x > 50, y < 50), we want LEFT or BOTTOM
    // If source is in bottom left corner (x < 50, y > 50), we want RIGHT or TOP
    // If source is in bottom right corner (x > 50, y > 50), we want LEFT or TOP
    
    let preferredDirections = [];
    if (source.y < 50) {
        // Top half
        if (teamSide === 'left') {
            preferredDirections = [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 }]; // RIGHT, BOTTOM
        } else {
            preferredDirections = [{ dx: -1, dy: 0 }, { dx: 0, dy: 1 }]; // LEFT, BOTTOM
        }
    } else {
        // Bottom half
        if (teamSide === 'left') {
            preferredDirections = [{ dx: 1, dy: 0 }, { dx: 0, dy: -1 }]; // RIGHT, TOP
        } else {
            preferredDirections = [{ dx: -1, dy: 0 }, { dx: 0, dy: -1 }]; // LEFT, TOP
        }
    }
    
    // Try preferred directions first
    for (const dir of preferredDirections) {
        const pos = { x: source.x + dir.dx, y: source.y + dir.dy };
        if (pos.x >= 0 && pos.x < 100 && pos.y >= 0 && pos.y < 100) {
            return pos;
        }
    }
    
    // Fallback to any cardinal direction
    for (const dir of directions) {
        const pos = { x: source.x + dir.dx, y: source.y + dir.dy };
        if (pos.x >= 0 && pos.x < 100 && pos.y >= 0 && pos.y < 100) {
            return pos;
        }
    }
    
    return null;
}

// Helper function to get positions around the creep for extensions
// Returns only the empty spaces (not the source or walls)
function getExtensionPositions(creep, source) {
    const positions = [];
    const offsets = [
        { dx: 0, dy: -1 }, // TOP
        { dx: 1, dy: -1 }, // TOP_RIGHT
        { dx: 1, dy: 0 },  // RIGHT
        { dx: 1, dy: 1 },  // BOTTOM_RIGHT
        { dx: 0, dy: 1 },  // BOTTOM
        { dx: -1, dy: 1 }, // BOTTOM_LEFT
        { dx: -1, dy: 0 }, // LEFT
        { dx: -1, dy: -1 } // TOP_LEFT
    ];
    
    for (const offset of offsets) {
        const pos = { x: creep.x + offset.dx, y: creep.y + offset.dy };
        
        // Skip if out of bounds
        if (pos.x < 0 || pos.x >= 100 || pos.y < 0 || pos.y >= 100) {
            continue;
        }
        
        // Skip if this is the source position
        if (source && pos.x === source.x && pos.y === source.y) {
            continue;
        }
        
        positions.push(pos);
    }
    
    return positions;
}

export function act_miner(creepInfo, controller, winObjective) {
    const creep = getObjectById(creepInfo.id);
    if (!creep) {
        return;
    }
    
    // Initialize memory if not set
    if (!creepInfo.memory.initialized) {
        // Count how many miners exist before this one
        const minerCount = controller.creeps.filter(c => 
            c.job === 'miner' && c.id !== creepInfo.id
        ).length;
        
        // Assign source based on miner index
        const assignedSource = assignSourceToMiner(minerCount);
        if (assignedSource) {
            creepInfo.memory.sourceId = assignedSource.id;
            creepInfo.memory.targetX = null;
            creepInfo.memory.targetY = null;
            creepInfo.memory.state = 'moving_to_position';
            creepInfo.memory.stage = 1; // Stage 1: building extensions
            creepInfo.memory.extensionsCreated = false;
        }
        creepInfo.memory.initialized = true;
    }
    
    // Get the assigned source
    const source = getObjectById(creepInfo.memory.sourceId);
    if (!source) {
        console.log(`Miner ${creepInfo.id} has no valid source`);
        return;
    }
    
    // State: Moving to mining position
    if (creepInfo.memory.state === 'moving_to_position') {
        // Calculate target position if not already set
        if (creepInfo.memory.targetX === null || creepInfo.memory.targetY === null) {
            const miningPos = findMiningPosition(source);
            if (miningPos) {
                creepInfo.memory.targetX = miningPos.x;
                creepInfo.memory.targetY = miningPos.y;
            } else {
                console.log(`Miner ${creepInfo.id} couldn't find mining position`);
                return;
            }
        }
        
        const targetPos = { x: creepInfo.memory.targetX, y: creepInfo.memory.targetY };
        
        // Check if we've arrived
        if (creep.x === targetPos.x && creep.y === targetPos.y) {
            creepInfo.memory.state = 'mining';
            console.log(`Miner ${creepInfo.id} arrived at mining position`);
        } else {
            // Move to the target position
            creep.moveTo(targetPos);
        }
        return;
    }
    
    // State: Mining and working
    if (creepInfo.memory.state === 'mining') {
        const usedCapacity = creep.store[RESOURCE_ENERGY] || 0;
        
        // Alternate between mining and using resources
        if (usedCapacity === 0) {
            // Mine from source
            const harvestResult = creep.harvest(source);
            if (harvestResult === ERR_NOT_IN_RANGE) {
                console.log(`Miner ${creepInfo.id} not in range of source`);
            }
        } else {
            // Use the resources based on current stage
            if (creepInfo.memory.stage === 1) {
                // Stage 1: Create and build extensions
                
                // Create construction sites if not already done
                if (!creepInfo.memory.extensionsCreated) {
                    // const extensionPositions = getExtensionPositions(creep, source);
                    
                    // // Create construction sites (limit to EXTENSIONS_PER_MINER)
                    // let created = 0;
                    // for (const pos of extensionPositions) {
                    //     if (created >= EXTENSIONS_PER_MINER) break;
                    //     if (getTerrainAt(pos) == TERRAIN_WALL) continue;
                        
                    //     const result = createConstructionSite(pos, StructureExtension);
                    //     if (result.object) {
                    //         created++;
                    //         console.log("created a extension site at: " + result.object.x + ", " + result.object.y);
                    //     } else {
                    //         console.log("failed to create an extension site:");
                    //         console.log(result);
                    //     }
                    // }

                    const extensionPosition = {x: creep.x, y: creep.y}
                    const result = createConstructionSite(pos, StructureExtension);
                    if (result.object) {
                        console.log("created a extension site at: " + result.object.x + ", " + result.object.y);
                    } else {
                        console.log("failed to create an extension site:");
                        console.log(result);
                    }
                    
                    creepInfo.memory.extensionsCreated = true;
                }
                
                // Find construction sites around the miner
                const allConstructionSites = getObjectsByPrototype(ConstructionSite).filter(c => c.my);
                const nearbyConstructionSites = allConstructionSites.filter(site => {
                    const range = getRange(creep, site);
                    // Only consider construction sites within 1 tile (the 8 surrounding tiles)
                    return range <= 1;
                });
                
                if (nearbyConstructionSites.length > 0) {
                    // Build the nearest construction site
                    const target = creep.findClosestByRange(nearbyConstructionSites);
                    if (target) {
                        const buildResult = creep.build(target);
                        if (buildResult === ERR_NOT_IN_RANGE) {
                            console.log(`Miner ${creepInfo.id} not in range of construction site`);
                        }
                    }
                } else {
                    // Check if all extensions nearby are built (construction is complete)
                    const allExtensions = getObjectsByPrototype(StructureExtension).filter(e => e.my);
                    const nearbyExtensions = allExtensions.filter(ext => {
                        const range = getRange(creep, ext);
                        return range <= 1;
                    });
                    
                    if (nearbyExtensions.length >= EXTENSIONS_PER_MINER) {
                        // All extensions are built, move to stage 2
                        creepInfo.memory.stage = 2;
                        console.log(`Miner ${creepInfo.id} moving to stage 2 with ${nearbyExtensions.length} extensions`);
                    } else {
                        // console.log("extensions or sites not found");
                    }
                }
            } else if (creepInfo.memory.stage === 2) {
                // Stage 2: Deposit to least full extension
                
                // Find all extensions around the miner
                const allExtensions = getObjectsByPrototype(StructureExtension).filter(e => e.my);
                const nearbyExtensions = allExtensions.filter(ext => {
                    const range = getRange(creep, ext);
                    return range <= 1; // Only extensions immediately adjacent
                });
                
                if (nearbyExtensions.length > 0) {
                    // Find the least full extension
                    let leastFullExtension = null;
                    let minEnergy = Infinity;
                    
                    for (const ext of nearbyExtensions) {
                        const energy = ext.store[RESOURCE_ENERGY] || 0;
                        const capacity = ext.store.getCapacity(RESOURCE_ENERGY);
                        
                        // Only consider extensions that are not full
                        if (energy < capacity && energy < minEnergy) {
                            minEnergy = energy;
                            leastFullExtension = ext;
                        }
                    }
                    
                    if (leastFullExtension) {
                        const transferResult = creep.transfer(leastFullExtension, RESOURCE_ENERGY);
                        if (transferResult === ERR_NOT_IN_RANGE) {
                            console.log(`Miner ${creepInfo.id} not in range of extension`);
                        }
                    }
                }
            }
        }
    }
}
