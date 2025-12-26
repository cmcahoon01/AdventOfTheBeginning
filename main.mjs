import { getObjectsByPrototype } from 'game/utils';
import { ConstructionSite, Creep, Source, StructureSpawn } from 'game/prototypes';
import { CARRY, MOVE, WORK, ERR_NOT_IN_RANGE } from 'game/constants';
import { RESOURCE_ENERGY } from 'game';
import { ScreepController } from './ScreepController.mjs';

const spawn = getObjectsByPrototype(StructureSpawn).find(i => i.my);
const constructionSite = getObjectsByPrototype(ConstructionSite).find(i => i.my);
const screepController = new ScreepController();

export function loop() {
    console.log(spawn.spawning);

    if(!spawn.spawning) {
        const result = spawn.spawnCreep([WORK, CARRY, MOVE, MOVE]);
        if (result && result.object && !result.error) {
            // Add the newly spawned creep to the controller with a default job
            screepController.addCreep(result.object.id, 'miner');
        }
    }

    // Use the controller to update all creeps
    screepController.updateCreeps();
}