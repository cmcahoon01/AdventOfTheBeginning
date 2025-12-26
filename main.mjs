import { getObjectsByPrototype } from 'game/utils';
import { ConstructionSite, Creep, Source, StructureSpawn } from 'game/prototypes';
import { CARRY, MOVE, WORK, ERR_NOT_IN_RANGE } from 'game/constants';
import { RESOURCE_ENERGY } from 'game';
import { ScreepController } from './ScreepController.mjs';
import { BuildOrder } from './BuildOrder.mjs';

const spawn = getObjectsByPrototype(StructureSpawn).find(i => i.my);
const constructionSite = getObjectsByPrototype(ConstructionSite).find(i => i.my);
const screepController = new ScreepController();
const buildOrder = new BuildOrder(screepController);

export function loop() {
    // Try to spawn the next creep in the build order
    buildOrder.trySpawnNextCreep();

    // Use the controller to update all creeps
    screepController.updateCreeps();
}