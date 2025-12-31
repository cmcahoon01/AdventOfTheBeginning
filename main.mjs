import { getObjectsByPrototype } from 'game/utils';
import { ConstructionSite, Creep, Source, StructureSpawn } from 'game/prototypes';
import { CARRY, MOVE, WORK, ERR_NOT_IN_RANGE } from 'game/constants';
import { RESOURCE_ENERGY } from 'game';
import { ScreepController } from './src/controllers/ScreepController.mjs';
import { BuildOrder } from './src/controllers/BuildOrder.mjs';
import { GameState } from './src/services/GameState.mjs';

const spawn = getObjectsByPrototype(StructureSpawn).find(i => i.my);
const winObjective = getObjectsByPrototype(ConstructionSite).find(i => i.my);
const screepController = new ScreepController();
const gameState = new GameState(screepController);
const buildOrder = new BuildOrder(screepController, winObjective, gameState);

export function loop() {
    // Refresh game state cache once per tick
    gameState.refresh();

    // Check if there's a spawning creep that needs to be added to memory
    buildOrder.checkAndAddSpawningCreep();

    // Try to spawn the next creep in the build order
    buildOrder.trySpawnNextCreep();

    // Use the controller to update all creeps
    screepController.updateCreeps(winObjective, gameState);
}