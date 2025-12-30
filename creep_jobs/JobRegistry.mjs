import { fighterJob } from './fighter.mjs';
import { archerJob } from './archer.mjs';
import { haulerJob } from './hauler.mjs';
import { minerJob } from './miner.mjs';
import { clericJob } from './cleric.mjs';

// Registry to map job names to their singleton instances
export const JOB_REGISTRY = {
    fighter: fighterJob,
    archer: archerJob,
    hauler: haulerJob,
    miner: minerJob,
    cleric: clericJob
};

// Helper function to get job instance by name
export function getJob(jobName) {
    return JOB_REGISTRY[jobName];
}

// Helper function to get all job names
export function getJobNames() {
    return Object.keys(JOB_REGISTRY);
}
