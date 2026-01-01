import { LEFT, RIGHT } from 'game/constants';

/**
 * Manages spawn queue and tracks pending spawns.
 * Handles the coordination between spawn requests and creep memory addition.
 */
export class BuildQueue {
    constructor(screepController, gameState) {
        this.screepController = screepController;
        this.gameState = gameState;
        // Track the job type of the creep currently being spawned
        this.pendingSpawnJob = null;
        // Track if spawn direction has been set
        this.spawnDirectionSet = false;
    }

    /**
     * Check if there's a spawning creep that hasn't been added to memory yet.
     * Adds the creep to the controller once it starts spawning.
     * @param {Object} winObjective - The win objective to pass to new creeps
     */
    checkAndAddSpawningCreep(winObjective) {
        const spawn = this.gameState.getMySpawn();
        
        // If spawn is spawning a creep and we have a pending job
        if (spawn && spawn.spawning && this.pendingSpawnJob) {
            const creepId = spawn.spawning.creep.id;

            if (creepId === undefined) {
                console.log("spawning creep undefined");
                return;
            }
            
            // Check if this creep is already in our controller
            const alreadyAdded = this.screepController.creeps.some(c => c.id === creepId);
            
            if (!alreadyAdded) {
                // Add the creep to memory with its job
                this.screepController.addCreep(creepId, this.pendingSpawnJob, winObjective, this.gameState);
            }
            // Clear pending job once we've checked and processed it
            this.pendingSpawnJob = null;
        } else if (this.pendingSpawnJob && (!spawn || !spawn.spawning)) {
            // Clear pending job if spawn is no longer spawning but we still have a pending job
            this.pendingSpawnJob = null;
        }
    }

    /**
     * Set spawn directions based on game state and team position.
     * Initially spawns towards win objective, then inverts after initial transfer.
     * @param {Object} spawn - The spawn structure
     * @param {Object} winObjective - The win objective construction site
     */
    setSpawnDirections(spawn, winObjective) {
        if (!spawn || !winObjective) {
            return;
        }

        const hasInitialized = this.gameState.getHasInitializedWinObjective();
        
        // Determine which side of the map we're on (left vs right of center)
        const mapCenter = 50; // Screeps Arena maps are typically 100x100
        const isOnLeftSide = spawn.x < mapCenter;
        
        if (!hasInitialized) {
            // Before initial transfer: spawn towards win objective on our side
            // If we're on the left side, spawn LEFT (towards our side/win objective)
            // If we're on the right side, spawn RIGHT (towards our side/win objective)
            if (isOnLeftSide) {
                spawn.setDirections([LEFT]);
                console.log('Setting spawn direction to LEFT (towards win objective)');
            } else {
                spawn.setDirections([RIGHT]);
                console.log('Setting spawn direction to RIGHT (towards win objective)');
            }
        } else {
            // After initial transfer: invert spawn direction towards enemy
            // If we're on the left side, spawn RIGHT (towards enemy on right)
            // If we're on the right side, spawn LEFT (towards enemy on left)
            if (isOnLeftSide) {
                spawn.setDirections([RIGHT]);
                console.log('Setting spawn direction to RIGHT (towards enemy)');
            } else {
                spawn.setDirections([LEFT]);
                console.log('Setting spawn direction to LEFT (towards enemy)');
            }
        }
    }

    /**
     * Attempt to spawn a creep with the given configuration.
     * @param {Object} nextCreep - Creep configuration with job, body, and cost
     * @param {number} availableEnergy - Total energy available for spawning
     * @param {Object} winObjective - The win objective to determine spawn direction
     * @returns {boolean} True if spawn was successful, false otherwise
     */
    trySpawn(nextCreep, availableEnergy, winObjective) {
        const spawn = this.gameState.getMySpawn();
        
        // Check if spawn exists and is not currently spawning
        if (!spawn || spawn.spawning) {
            return false;
        }

        // Check if we have enough energy
        if (availableEnergy < nextCreep.cost) {
            return false;
        }

        // Set spawn directions based on game state
        this.setSpawnDirections(spawn, winObjective);

        // Try to spawn the creep
        const result = spawn.spawnCreep(nextCreep.body);
        if (result && result.object && !result.error) {
            // Mark the job as pending - we'll add it to memory once spawn.spawning is available
            this.pendingSpawnJob = nextCreep.job;
            console.log(`Started spawning ${nextCreep.job} (cost: ${nextCreep.cost}, available energy: ${availableEnergy})`);
            return true;
        }

        return false;
    }
}
