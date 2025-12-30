import { getObjectsByPrototype } from 'game/utils';
import { StructureSpawn, StructureExtension } from 'game/prototypes';
import { RESOURCE_ENERGY } from 'game/constants';
import { JOB_REGISTRY } from './creep_jobs/JobRegistry.mjs';

// Build order configuration
// Each entry specifies the job type
const BUILD_ORDER_TEMPLATE = [
    { jobName: 'cleric' },
    { jobName: 'hauler' },
    { jobName: 'fighter' },
    { jobName: 'miner' },
    { jobName: 'fighter' },
    { jobName: 'miner' },
    { jobName: 'archer' }
    // After position 5, haulers are built infinitely
];

export class BuildOrder {
    constructor(screepController) {
        this.screepController = screepController;
        this.buildOrderTemplate = BUILD_ORDER_TEMPLATE;
        // Track the job type of the creep currently being spawned
        this.pendingSpawnJob = null;
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
        const extensions = getObjectsByPrototype(StructureExtension).filter(c => c.my);
        for (const extension of extensions) {
            if (extension.store) {
                totalEnergy += extension.store[RESOURCE_ENERGY] || 0;
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
            archer: 0,
            hauler: 0,
            miner: 0,
            cleric: 0
        };

        for (const creepInfo of creeps) {
            if (creepCounts[creepInfo.job] !== undefined) {
                creepCounts[creepInfo.job]++;
            }
        }

        // Check each position in the build order template
        for (let i = 0; i < this.buildOrderTemplate.length; i++) {
            const template = this.buildOrderTemplate[i];
            const jobName = template.jobName;
            const jobClass = JOB_REGISTRY[jobName];
            
            if (!jobClass) {
                console.log(`Warning: Unknown job type '${jobName}' in build order`);
                continue;
            }
            
            // Count how many of this job should exist up to and including this position
            let expectedCount = 0;
            for (let j = 0; j <= i; j++) {
                if (this.buildOrderTemplate[j].jobName === jobName) {
                    expectedCount++;
                }
            }

            // If we don't have enough of this job type, build it
            if (creepCounts[jobName] < expectedCount) {
                return { 
                    job: jobName, 
                    body: jobClass.constructor.BODY, 
                    cost: jobClass.constructor.COST 
                };
            }
        }

        // After completing the initial build order, build haulers infinitely
        const haulerJob = JOB_REGISTRY['hauler'];
        return { 
            job: 'hauler', 
            body: haulerJob.constructor.BODY, 
            cost: haulerJob.constructor.COST 
        };
    }

    // Check if there's a spawning creep that hasn't been added to memory yet
    checkAndAddSpawningCreep() {
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        
        // If spawn is spawning a creep and we have a pending job
        if (spawn && spawn.spawning && this.pendingSpawnJob) {
            const creepId = spawn.spawning.creep.id;

            if (creepId === undefined){
                console.log("spawning creep undefined");
                return;
            }
            
            // Check if this creep is already in our controller
            const alreadyAdded = this.screepController.creeps.some(c => c.id === creepId);
            
            if (!alreadyAdded) {
                // Add the creep to memory with its job
                this.screepController.addCreep(creepId, this.pendingSpawnJob);
                console.log(`Added spawning ${this.pendingSpawnJob} with id ${creepId} to memory`);
            }
            // Clear pending job once we've checked and processed it
            this.pendingSpawnJob = null;
        } else if (this.pendingSpawnJob && (!spawn || !spawn.spawning)) {
            // Clear pending job if spawn is no longer spawning but we still have a pending job
            this.pendingSpawnJob = null;
        }
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
            // Mark the job as pending - we'll add it to memory once spawn.spawning is available
            this.pendingSpawnJob = nextCreep.job;
            console.log(`Started spawning ${nextCreep.job} (cost: ${nextCreep.cost}, available energy: ${totalEnergy})`);
            return true;
        }

        return false;
    }
}
