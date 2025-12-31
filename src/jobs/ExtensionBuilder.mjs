import { getObjectsByPrototype, getRange, getTerrainAt } from 'game/utils';
import { StructureExtension, ConstructionSite } from 'game/prototypes';
import { TERRAIN_WALL, ERR_NOT_IN_RANGE } from 'game/constants';
import { createConstructionSite } from 'game';
import { isAdjacent } from '../utils/RangeUtils.mjs';

// Number of extensions each miner should create
export const EXTENSIONS_PER_MINER = 5;

/**
 * Manages extension construction for miners.
 * Handles creation and building of extension construction sites.
 */
export class ExtensionBuilder {
    /**
     * Get positions around a creep for placing extensions.
     * Returns only the empty spaces (not the source or walls).
     * @param {Object} creep - The miner creep
     * @param {Object} source - The source to avoid
     * @returns {Array} Array of valid positions for extensions
     */
    static getExtensionPositions(creep, source) {
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

    /**
     * Create extension construction sites around a creep.
     * @param {Object} creep - The miner creep
     * @param {Object} source - The source to avoid
     * @returns {number} Number of construction sites created
     */
    static createExtensionSites(creep, source) {
        const extensionPositions = this.getExtensionPositions(creep, source);
        
        // Create construction sites (limit to EXTENSIONS_PER_MINER)
        let created = 0;
        for (const pos of extensionPositions) {
            if (created >= EXTENSIONS_PER_MINER) break;
            if (getTerrainAt(pos) === TERRAIN_WALL) continue;
            
            const result = createConstructionSite(pos, StructureExtension);
            if (result.object) {
                created++;
            } else {
                console.log("failed to create an extension site:");
                console.log(result);
            }
        }
        
        if (created < EXTENSIONS_PER_MINER) {
            console.log(`Could only create ${created} extension sites`);
        }
        
        return created;
    }

    /**
     * Build nearby construction sites.
     * @param {Object} creep - The miner creep
     * @returns {boolean} True if building action was taken
     */
    static buildNearbyConstructionSites(creep) {
        const allConstructionSites = getObjectsByPrototype(ConstructionSite).filter(c => c.my);
        const nearbyConstructionSites = allConstructionSites.filter(site => {
            // Only consider construction sites within 1 tile (the 8 surrounding tiles)
            return isAdjacent(creep, site);
        });
        
        if (nearbyConstructionSites.length > 0) {
            // Build the nearest construction site
            const target = creep.findClosestByRange(nearbyConstructionSites);
            if (target) {
                const buildResult = creep.build(target);
                if (buildResult === ERR_NOT_IN_RANGE) {
                    console.log(`Creep ${creep.id} not in range of construction site`);
                }
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if all extensions nearby are built (construction is complete).
     * @param {Object} creep - The miner creep
     * @returns {boolean} True if all extensions are built
     */
    static areExtensionsComplete(creep) {
        const allExtensions = getObjectsByPrototype(StructureExtension).filter(e => e.my);
        const nearbyExtensions = allExtensions.filter(ext => isAdjacent(creep, ext));
        
        return nearbyExtensions.length >= EXTENSIONS_PER_MINER;
    }

    /**
     * Fill extensions with energy.
     * Transfers energy to the least full extension nearby.
     * @param {Object} creep - The miner creep
     * @param {string} resourceType - The resource type to transfer (e.g., RESOURCE_ENERGY)
     * @returns {boolean} True if transfer action was taken
     */
    static fillExtensions(creep, resourceType) {
        // Find all extensions around the miner
        const allExtensions = getObjectsByPrototype(StructureExtension).filter(e => e.my);
        const nearbyExtensions = allExtensions.filter(ext => isAdjacent(creep, ext));
        
        if (nearbyExtensions.length > 0) {
            // Find the least full extension
            let leastFullExtension = null;
            let minEnergy = Infinity;
            
            for (const ext of nearbyExtensions) {
                const energy = ext.store[resourceType] || 0;
                const capacity = ext.store.getCapacity(resourceType);
                
                // Only consider extensions that are not full
                if (energy < capacity && energy < minEnergy) {
                    minEnergy = energy;
                    leastFullExtension = ext;
                }
            }
            
            if (leastFullExtension) {
                const transferResult = creep.transfer(leastFullExtension, resourceType);
                if (transferResult === ERR_NOT_IN_RANGE) {
                    console.log(`Creep ${creep.id} not in range of extension`);
                }
                return true;
            }
        }
        
        return false;
    }
}
