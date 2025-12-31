import { getObjectsByPrototype } from 'game/utils';
import { StructureSpawn, StructureExtension } from 'game/prototypes';
import { RESOURCE_ENERGY } from 'game/constants';

/**
 * Manages energy calculations across spawn and extensions.
 * Provides centralized access to total available energy for build decisions.
 */
export class EnergyManager {
    /**
     * Calculate total available energy from spawn and all extensions.
     * @returns {number} Total energy available across all energy-storing structures
     */
    getTotalEnergy() {
        let totalEnergy = 0;

        // Get energy from spawn
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        if (spawn && spawn.store) {
            totalEnergy += spawn.store[RESOURCE_ENERGY] || 0;
        }

        // Get energy from all extensions
        const extensions = getObjectsByPrototype(StructureExtension).filter(c => c.my);
        for (const extension of extensions) {
            if (extension.store) {
                totalEnergy += extension.store[RESOURCE_ENERGY] || 0;
            }
        }

        return totalEnergy;
    }
}
