// Abstract base class for all creep jobs
export class Job {
    constructor() {
        if (new.target === Job) {
            throw new TypeError("Cannot construct Job instances directly");
        }
    }

    // Abstract method that must be implemented by subclasses
    act(creepInfo, controller, winObjective) {
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
