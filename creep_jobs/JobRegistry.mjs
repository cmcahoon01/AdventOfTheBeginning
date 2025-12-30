import { FighterJob, fighterJob } from './fighter.mjs';
import { ArcherJob, archerJob } from './archer.mjs';
import { HaulerJob, haulerJob } from './hauler.mjs';
import { MinerJob, minerJob } from './miner.mjs';
import { ClericJob, clericJob } from './cleric.mjs';

// Registry to map job names to their singleton instances
export const JOB_REGISTRY = {
    fighter: fighterJob,
    archer: archerJob,
    hauler: haulerJob,
    miner: minerJob,
    cleric: clericJob
};

// Registry to map job names to their classes
export const JOB_CLASSES = {
    fighter: FighterJob,
    archer: ArcherJob,
    hauler: HaulerJob,
    miner: MinerJob,
    cleric: ClericJob
};

// Helper function to get job instance by name
export function getJob(jobName) {
    return JOB_REGISTRY[jobName];
}

// Helper function to get job class by name
export function getJobClass(jobName) {
    return JOB_CLASSES[jobName];
}

// Helper function to get all job names
export function getJobNames() {
    return Object.keys(JOB_REGISTRY);
}
