import { FighterJob } from './fighter.mjs';
import { ArcherJob } from './archer.mjs';
import { HaulerJob } from './hauler.mjs';
import { MinerJob } from './miner.mjs';
import { ClericJob } from './cleric.mjs';

// Frozen registry mapping job names to their classes
export const Jobs = Object.freeze({
    fighter: FighterJob,
    archer: ArcherJob,
    hauler: HaulerJob,
    miner: MinerJob,
    cleric: ClericJob
});
