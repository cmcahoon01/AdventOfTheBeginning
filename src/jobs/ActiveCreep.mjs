// Base class for active creeps that combines CreepInfo data with Job behavior
export class ActiveCreep {
    constructor(id, jobName, controller, winObjective, gameState) {
        if (new.target === ActiveCreep) {
            throw new TypeError("Cannot construct ActiveCreep instances directly");
        }
        this.id = id;
        this.jobName = jobName;
        this.controller = controller;
        this.winObjective = winObjective;
        this.gameState = gameState;
        this.memory = {}; // Dictionary to store creep-specific state/memory
    }

    // Abstract method that must be implemented by subclasses
    act() {
        throw new Error("Method 'act()' must be implemented by subclass");
    }

    // Static properties that subclasses should override
    static get BODY() {
        throw new Error("Static property 'BODY' must be defined by subclass");
    }

    static get COST() {
        throw new Error("Static property 'COST' must be defined by subclass");
    }

    static get JOB_NAME() {
        throw new Error("Static property 'JOB_NAME' must be defined by subclass");
    }
}
