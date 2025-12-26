import { getObjectsByPrototype } from 'game/utils';
import { ConstructionSite, Creep, Source, StructureSpawn } from 'game/prototypes';
import { CARRY, MOVE, WORK, ERR_NOT_IN_RANGE } from 'game/constants';
import { RESOURCE_ENERGY } from 'game';

const spawn = getObjectsByPrototype(StructureSpawn).find(i => i.my);
const constructionSite = getObjectsByPrototype(ConstructionSite).find(i => i.my);

export function loop() {
    if(!spawn.spawning) {
        spawn.spawnCreep([WORK, CARRY, MOVE, MOVE]);
    }

    var myCreeps = getObjectsByPrototype(Creep).filter(creep => creep.my);

    for(var creep of myCreeps) {
        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {      
            if(creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
                creep.moveTo(constructionSite);
            }
        } else {      
            const energySource = creep.findClosestByPath(getObjectsByPrototype(Source));
            if(creep.harvest(energySource) == ERR_NOT_IN_RANGE) {
                creep.moveTo(energySource);
            }
        }
    }    
}