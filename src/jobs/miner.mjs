import { getObjectById } from 'game/utils';
import { WORK, CARRY, MOVE, ERR_NOT_IN_RANGE, RESOURCE_ENERGY } from 'game/constants';
import { ActiveCreep } from './ActiveCreep.mjs';
import { SourceAssignmentStrategy } from './SourceAssignmentStrategy.mjs';
import { ExtensionBuilder } from './ExtensionBuilder.mjs';
import { MinerStateMachine } from './MinerStateMachine.mjs';
import { BodyPartCalculator } from '../constants.mjs';
import { CombatUtils } from '../utils/CombatUtils.mjs';

// Miner job - dedicated resource extraction and extension building
export class MinerJob extends ActiveCreep {
    static get BODY() {
        return [WORK, WORK, WORK, WORK, CARRY, MOVE];
    }

    static get COST() {
        return BodyPartCalculator.calculateCost(this.BODY);
    }

    static get JOB_NAME() {
        return 'miner';
    }

    act() {
        const creep = getObjectById(this.id);
        if (!creep) {
            return;
        }
        
        // Initialize memory if not set
        if (!this.memory.initialized) {
            // Count how many miners exist before this one (this is the 0-based index)
            const minerIndex = this.controller.creeps.filter(c => 
                c.jobName === 'miner' && c.id !== this.id
            ).length;
            
            // Assign source based on miner index
            const assignedSource = SourceAssignmentStrategy.assignSourceToMiner(minerIndex, this.gameState);
            if (assignedSource) {
                MinerStateMachine.initialize(this.memory, minerIndex, assignedSource);
            } else {
                // No source available - mark as initialized to avoid repeated attempts
                console.log(`Miner ${this.id} could not be assigned a source (index: ${minerIndex})`);
                this.memory.initialized = true;
                return; // Exit early - this miner cannot function
            }
        }
        
        // Get the assigned source
        const source = getObjectById(this.memory.sourceId);
        if (!source) {
            console.log(`Miner ${this.id} has no valid source`);
            return;
        }
        
        // State: Moving to mining position
        if (MinerStateMachine.isMovingToPosition(this.memory)) {
            // === DEFENSIVE POSTURING CHECK (only for miners not yet arrived) ===
            const shouldRetreat = CombatUtils.shouldAdoptDefensivePosture(this.gameState);
            
            if (shouldRetreat) {
                // Move to ramparts for defense instead of mining position
                const defensiveRampart = CombatUtils.findDefensiveRampartPosition(creep, this.gameState);
                if (defensiveRampart) {
                    // Check if we're already on a rampart
                    const onRampart = defensiveRampart.x === creep.x && defensiveRampart.y === creep.y;
                    
                    if (!onRampart) {
                        // Move to the defensive rampart
                        creep.moveTo(defensiveRampart);
                    }
                }
                return; // Don't continue with normal mining movement
            }
            
            // Calculate target position if not already set
            let targetPos = MinerStateMachine.getTargetPosition(this.memory);
            if (!targetPos) {
                const miningPos = SourceAssignmentStrategy.findMiningPosition(source, this.gameState);
                if (miningPos) {
                    MinerStateMachine.setTargetPosition(this.memory, miningPos);
                    targetPos = miningPos;
                } else {
                    console.log(`Miner ${this.id} couldn't find mining position`);
                    return;
                }
            }
            
            // Check if we've arrived
            if (MinerStateMachine.isAtTargetPosition(creep, this.memory)) {
                MinerStateMachine.transitionToMining(this.memory);
                console.log(`Miner ${this.id} arrived at mining position`);
            } else {
                // Move to the target position
                creep.moveTo(targetPos);
            }
            return;
        }
        
        // State: Mining and working
        if (MinerStateMachine.isMining(this.memory)) {
            const usedCapacity = creep.store[RESOURCE_ENERGY] || 0;
            
            // Alternate between mining and using resources
            if (usedCapacity === 0) {
                // Mine from source
                const harvestResult = creep.harvest(source);
                if (harvestResult === ERR_NOT_IN_RANGE) {
                    console.log(`Miner ${this.id} not in range of source`);
                }
            } else {
                // Use the resources based on current stage
                if (MinerStateMachine.isStage1(this.memory)) {
                    // Stage 1: Create and build extensions
                    
                    // Create construction sites if not already done
                    if (!MinerStateMachine.extensionsCreated(this.memory)) {
                        ExtensionBuilder.createExtensionSites(creep, source);
                        MinerStateMachine.markExtensionsCreated(this.memory);
                    }
                    
                    // Try to build nearby construction sites
                    const isBuilding = ExtensionBuilder.buildNearbyConstructionSites(creep, this.gameState);
                    
                    if (!isBuilding) {
                        // Check if all extensions nearby are built (construction is complete)
                        if (ExtensionBuilder.areExtensionsComplete(creep, this.gameState)) {
                            // All extensions are built, move to stage 2
                            MinerStateMachine.transitionToStage2(this.memory);
                            console.log(`Miner ${this.id} moving to stage 2`);
                        }
                    }
                } else if (MinerStateMachine.isStage2(this.memory)) {
                    // Stage 2: Deposit to least full extension
                    ExtensionBuilder.fillExtensions(creep, RESOURCE_ENERGY, this.gameState);
                }
            }
        }
    }
}
