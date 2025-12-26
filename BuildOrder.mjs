import { getObjectsByPrototype } from 'game/utils';
import { StructureSpawn, StructureContainer } from 'game/prototypes';
import { RESOURCE_ENERGY } from 'game/constants';
import { FIGHTER_BODY, FIGHTER_COST } from './creep_jobs/fighter.mjs';
import { HAULER_BODY, HAULER_COST } from './creep_jobs/hauler.mjs';
import { MINER_BODY, MINER_COST } from './creep_jobs/miner.mjs';

// Build order configuration
// Each entry specifies the job type, body, and cost
const BUILD_ORDER_TEMPLATE = [
    { job: 'fighter', body: FIGHTER_BODY, cost: FIGHTER_COST },
    { job: 'hauler', body: HAULER_BODY, cost: HAULER_COST },
    { job: 'miner', body: MINER_BODY, cost: MINER_COST },
    { job: 'miner', body: MINER_BODY, cost: MINER_COST },
    { job: 'fighter', body: FIGHTER_BODY, cost: FIGHTER_COST }
    // After position 5, haulers are built infinitely
];

export class BuildOrder {
    constructor(screepController) {
        this.screepController = screepController;
        this.buildOrderTemplate = BUILD_ORDER_TEMPLATE;
    }

    // Calculate total available energy from spawn and all containers
    getTotalEnergy() {
        let totalEnergy = 0;

        // Get energy from spawn
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        if (spawn && spawn.store) {
            totalEnergy += spawn.store[RESOURCE_ENERGY] || 0;
        }

        // Get energy from all containers
        const containers = getObjectsByPrototype(StructureContainer).filter(c => c.my);
        for (const container of containers) {
            if (container.store) {
                totalEnergy += container.store[RESOURCE_ENERGY] || 0;
            }
        }

        return totalEnergy;
    }

    // Get the next creep to build based on the current build order state
    getNextCreepToBuild() {
        const creeps = this.screepController.creeps;
        
        // Count creeps by job type
        const creepCounts = {
            fighter: 0,
            hauler: 0,
            miner: 0
        };

        for (const creepInfo of creeps) {
            if (creepCounts[creepInfo.job] !== undefined) {
                creepCounts[creepInfo.job]++;
            }
        }

        // Check each position in the build order template
        for (let i = 0; i < this.buildOrderTemplate.length; i++) {
            const template = this.buildOrderTemplate[i];
            
            // Count how many of this job should exist up to and including this position
            let expectedCount = 0;
            for (let j = 0; j <= i; j++) {
                if (this.buildOrderTemplate[j].job === template.job) {
                    expectedCount++;
                }
            }

            // If we don't have enough of this job type, build it
            if (creepCounts[template.job] < expectedCount) {
                return template;
            }
        }

        // After completing the initial build order, build haulers infinitely
        return { job: 'hauler', body: HAULER_BODY, cost: HAULER_COST };
    }

    // Attempt to spawn the next creep in the build order
    trySpawnNextCreep() {
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        
        // Check if spawn exists and is not currently spawning
        if (!spawn || spawn.spawning) {
            return false;
        }

        // Get the next creep to build
        const nextCreep = this.getNextCreepToBuild();
        if (!nextCreep) {
            return false;
        }

        // Check if we have enough energy
        const totalEnergy = this.getTotalEnergy();
        if (totalEnergy < nextCreep.cost) {
            return false;
        }

        // Try to spawn the creep
        const result = spawn.spawnCreep(nextCreep.body);
        if (result && result.object && !result.error) {
            // Add the newly spawned creep to the controller
            this.screepController.addCreep(spawn.spawning.creep.id, nextCreep.job);
            console.log(`Spawned ${nextCreep.job} (cost: ${nextCreep.cost}, available energy: ${totalEnergy})`);
            return true;
        }

        return false;
    }
}
