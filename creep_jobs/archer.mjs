import { RANGED_ATTACK, MOVE } from 'game/constants';
import { RangedJob } from './RangedJob.mjs';

// Archer job - ranged combat without healing (behaves like cleric without healing)
class ArcherJob extends RangedJob {
    static get BODY() {
        return [MOVE, RANGED_ATTACK];
    }

    static get COST() {
        return 200; // 50 + 150
    }

    static get JOB_NAME() {
        return 'archer';
    }

    // Archer does not heal
    shouldHealDuringIdle() {
        return false;
    }
}

// Export singleton instance and constants for backwards compatibility
export const archerJob = new ArcherJob();
export const ARCHER_BODY = ArcherJob.BODY;
export const ARCHER_COST = ArcherJob.COST;

// Backwards compatibility for act_archer function
export function act_archer(creepInfo, controller, winObjective) {
    archerJob.act(creepInfo, controller, winObjective);
}
