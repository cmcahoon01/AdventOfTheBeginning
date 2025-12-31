
arena.screeps.com
Screeps Arena Documentation
40–51 minutes
ConstructionSite

class extends GameObject

A site of a structure which is currently under construction. To build a structure on the construction site, give a worker creep some amount of energy and perform the Creep.build action.
my

boolean

Whether it is your construction site.
progress

number

The current construction progress.
progressTotal

number

The total construction progress needed for the structure to be built.
structure

The structure that will be built (when the construction site is completed)
remove()

Remove this construction site.
CostMatrix

class 

Container for custom navigation cost data. If a non-0 value is found in the CostMatrix then that value will be used instead of the default terrain cost.
clone()

Copy this CostMatrix into a new CostMatrix with the same data and return new CostMatrix
constructor()

Creates a new CostMatrix containing 0's for all positions.

import { CostMatrix } from 'game/path-finder';

export function loop() {
    let costs = new CostMatrix;
}

get(x, y)

Get the cost of a position in this CostMatrix.
parameter	type	description
x 	

number
	The X position in the game
y 	

number
	The Y position in the game
set(x, y, cost)

Set the cost of a position in this CostMatrix.
parameter	type	description
x 	

number
	The X position in the game
y 	

number
	The Y position in the game
cost 	

number
	Cost of this position. Must be a whole number. A cost of 0 will use the terrain cost for that tile. A cost greater than or equal to 255 will be treated as unwalkable.

import { CostMatrix } from 'game/path-finder';

export function loop() {
    let costs = new CostMatrix;
    costs.set(constructionSite.x, constructionSite.y, 10); // avoid walking over a construction site
}

Creep

class extends GameObject

Creeps are your units. Creeps can move, harvest energy, construct structures, attack another creeps, and perform other actions. Each creep consists of up to 50 body parts with the following possible types:
body part	cost	Effect per one body part
MOVE	50	

Decreases fatigue by 2 points per tick.
WORK	100	

Harvests 2 energy units from a source per tick.

Builds a structure for 5 energy units per tick.
CARRY	50	

Can contain up to 50 resource units.
ATTACK	80	

Attacks another creep/structure with 30 hits per tick in a short-ranged attack.
RANGED_ATTACK	150	

Attacks another single creep/structure with 10 hits per tick in a long-range attack up to 3 squares long.

Attacks all hostile creeps/structures within 3 squares range with 1-4-10 hits (depending on the range).
HEAL	250	

Heals self or another creep restoring 12 hits per tick in short range or 4 hits per tick at a distance.
TOUGH	10	

No effect, just additional hit points to the creep's body.
body

array

An array describing the creep’s body. Each element contains the following properties:
type	string	One of the body part types constants.
hits	number	The remaining amount of hit points of this body part.
fatigue

number

The movement fatigue indicator. If it is greater than zero, the creep cannot move.
hits

number

The current amount of hit points of the creep.
hitsMax

number

The maximum amount of hit points of the creep.
my

boolean

Whether it is your creep.
spawning

boolean

Whether this creep is still being spawned.
store

A Store object that contains cargo of this creep.
attack(target)

Attack another creep, structure, or construction site in a short-ranged attack. Requires the ATTACK body part. If the target is inside a rampart, then the rampart is attacked instead. The target has to be at adjacent square to the creep. This action cannot be executed on the same tick with harvest, build, heal, rangedHeal.
parameter	type	description
target 	

Creep

Structure

ConstructionSite
	The target object.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_INVALID_TARGET	-7	The target is not a valid attackable object.
ERR_NOT_IN_RANGE	-9	The target is too far away.
ERR_NO_BODYPART	-12	There are no ATTACK body parts in this creep’s body.

let hostileCreeps = getObjectsByPrototype(Creep).filter(i => !i.my);
let target = creep.findClosestByRange(hostileCreeps);
if (target){
    creep.move(target);
    creep.attack(target);
}

build(target)

Build a structure at the target construction site using carried energy. Requires WORK and CARRY body parts. The target has to be within 3 squares range of the creep. This action cannot be executed on the same tick with harvest, attack, heal, rangedHeal, rangedAttack, rangedMassAttack.
parameter	type	description
target 	

ConstructionSite
	The target construction site to be built.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_NOT_ENOUGH_RESOURCES	-6	The creep does not have any carried energy.
ERR_INVALID_TARGET	-7	The target is not a valid construction site object or the structure cannot be built here (probably because of an obstacle at the same square).
ERR_NOT_IN_RANGE	-9	The target is too far away.
ERR_FULL	-8	There is another construction site at the same location that's further along.
ERR_NO_BODYPART	-12	There are no WORK body parts in this creep’s body.

let myConstructionSites = getObjectsByPrototype(ConstructionSite).filter(i => i.my);
let target = creep.findClosestByRange(myConstructionSites);
if (target) {
    if (creep.build(target) == ERR_NOT_IN_RANGE) {
        creep.move(target);
    }
}

drop(resourceType, [amount])

Drop this resource on the ground.
parameter	type	description
resourceType 	

string
	One of the RESOURCE_* constants.
amount (optional)	

number
	The amount of resource units to be dropped. If omitted, all the available carried amount is used.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_NOT_ENOUGH_RESOURCES	-6	The creep does not have the given amount of resources.
ERR_INVALID_ARGS	-10	The resourceType is not a valid RESOURCE_* constant.

creep.drop(RESOURCE_ENERGY);

harvest(target)

Harvest energy from the source. Requires the WORK body part. If the creep has an empty CARRY body part, the harvested resource is put into it; otherwise it is dropped on the ground. The target has to be at an adjacent square to the creep. This action cannot be executed on the same tick with attack, build, heal, rangedHeal.
parameter	type	description
target 	

Source
	The object to be harvested.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_NOT_ENOUGH_RESOURCES	-6	The target does not contain any harvestable resource.
ERR_INVALID_TARGET	-7	The target is not a valid source object.
ERR_NOT_IN_RANGE	-9	The target is too far away.
ERR_NO_BODYPART	-12	There are no WORK body parts in this creep’s body.

let activeSources = getObjectsByPrototype(Source).filter(i => i.energy > 0);
let source = creep.findClosestByRange(activeSources);
if(source){
    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.move(source);
    }
}

heal(target)

Heal self or another creep. It will restore the target creep’s damaged body parts function and increase the hits counter. Requires the HEAL body part. The target has to be at adjacent square to the creep. This action cannot be executed on the same tick with harvest, build, attack, rangedHeal.
parameter	type	description
target 	

Creep
	The target creep object.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_INVALID_TARGET	-7	The target is not a valid creep object.
ERR_NOT_IN_RANGE	-9	The target is too far away.
ERR_NO_BODYPART	-12	There are no HEAL body parts in this creep’s body.

let creeps = getObjectsByPrototype(Creep);
let myDamagedCreeps = creeps.filter(i => i.my && i.hits < i.hitsMax);
let target = tower.findClosestByRange(myDamagedCreeps);
if (creep.heal(target) == ERR_NOT_IN_RANGE) {
    creep.moveTo(target);
}

move(direction)

Move the creep one square in the specified direction. Requires the MOVE body part.
parameter	type	description
direction 	

number
	one of the following constants:
TOP TOP_RIGHT RIGHT BOTTOM_RIGHT BOTTOM BOTTOM_LEFT LEFT TOP_LEFT 

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_INVALID_ARGS	-10	The provided direction is incorrect.
ERR_TIRED	-11	The fatigue indicator of the creep is non-zero.
ERR_NO_BODYPART	-12	There are no MOVE body parts in this creep’s body.

creep.move(RIGHT);

moveTo(target, opts)

Find the optimal path to the target and move to it. Requires the MOVE body part.
parameter	type	description
target 	

object
	Can be a GameObject or any object containing x and y properties.
opts 	

object
	An object with additional options that are passed to  findPath.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_TIRED	-11	The fatigue indicator of the creep is non-zero.
ERR_NO_BODYPART	-12	There are no MOVE body parts in this creep’s body.

creep1.moveTo(creep2);
creep2.moveTo({x: 50, y: 50});

pickup(target)

Pick up an item (a dropped piece of resource). Requires the CARRY body part. The target has to be at adjacent square to the creep or at the same square.
parameter	type	description
target 	

Resource
	The target object to be picked up.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_INVALID_TARGET	-7	The target is not a valid creep object.
ERR_FULL	-8	The creep cannot receive any more resource.
ERR_NOT_IN_RANGE	-9	The target is too far away.

let resources = getObjectsByPrototype(Resource);
let target = creep.findClosestByRange(resources);
if (target) {
    if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}

pull(target)

Help another creep to follow this creep. The fatigue generated for the target's move will be added to the creep instead of the target. Requires the MOVE body part. The target has to be at adjacent square to the creep. The creep must move elsewhere, and the target must move towards the creep.
parameter	type	description
target 	

Creep
	The target creep.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_INVALID_TARGET	-7	The target is not a valid creep object.
ERR_NOT_IN_RANGE	-9	The target is too far away.

creep1.move(TOP);
creep1.pull(creep2);
creep2.moveTo(creep1);

rangedAttack(target)

A ranged attack against another creep or structure. Requires the RANGED_ATTACK body part. If the target is inside a rampart, the rampart is attacked instead. The target has to be within 3 squares range of the creep. This action cannot be executed on the same tick with rangedMassAttack, rangedHeal, build.
parameter	type	description
target 	

Creep

Structure
	The target object to be attacked up.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_INVALID_TARGET	-7	The target is not a valid attackable object.
ERR_NOT_IN_RANGE	-9	The target is too far away.
ERR_NO_BODYPART	-12	There are no RANGED_ATTACK body parts in this creep’s body.

let hostileCreeps = getObjectsByPrototype(Creep).filter(i => !i.my);
let targets = creep.findInRange(hostileCreeps);
if (targets.length) {
    creep.rangedAttack(targets[0]);
}

rangedHeal(target)

Heal another creep at a distance. It will restore the target creep’s damaged body parts function and increase the hits counter. Requires the HEAL body part. The target has to be within 3 squares range of the creep. This action cannot be executed on the same tick with harvest, build, heal, attack, rangedAttack, rangedMassAttack.
parameter	type	description
target 	

Creep
	The target creep object.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_INVALID_TARGET	-7	The target is not a valid attackable object.
ERR_NOT_IN_RANGE	-9	The target is too far away.
ERR_NO_BODYPART	-12	There are no HEAL body parts in this creep’s body.

let creeps = getObjectsByPrototype(Creep);
let myDamagedCreeps = creeps.filter(i => i.my && i.hits < i.hitsMax);
let targets = creep.findInRange(myDamagedCreeps);
if (targets.length) {
    creep.rangedHeal(targets[0]);
}

rangedMassAttack()

A ranged attack against all hostile creeps or structures within 3 squares range. Requires the RANGED_ATTACK body part. The attack power depends on the range to each target. Friendly units are not affected. This action cannot be executed on the same tick with rangedAttack, rangedHeal, build.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_NO_BODYPART	-12	There are no RANGED_ATTACK body parts in this creep’s body.
transfer(target, resourceType, [amount])

Transfer resource from the creep to another object. The target has to be at adjacent square to the creep.
parameter	type	description
target 	

Creep

Structure
	The target object.
resourceType 	

string
	One of the RESOURCE_* constants.
amount (optional)	

number
	The amount of resources to be transferred. If omitted, all the available carried amount is used.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_NOT_ENOUGH_RESOURCES	-6	The creep does not have the given amount of resources.
ERR_INVALID_TARGET	-7	The target is not a valid object which can contain the specified resource.
ERR_FULL	-8	The target cannot receive any more resources.
ERR_NOT_IN_RANGE	-9	The target is too far away.
ERR_INVALID_ARGS	-10	The resourceType is not one of the RESOURCE_* constants, or the amount is incorrect.

if (creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    creep.moveTo(tower);
}

withdraw(target, resourceType, [amount])

Withdraw resources from a structure. The target has to be at adjacent square to the creep. Multiple creeps can withdraw from the same object in the same tick. Your creeps can withdraw resources from hostile structures as well, in case if there is no hostile rampart on top of it.
parameter	type	description
target 	

Structure
	The target structure.
resourceType 	

string
	One of the RESOURCE_* constants.
amount (optional)	

number
	The amount of resources to be transferred. If omitted, all the available carried amount is used.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this creep.
ERR_NOT_ENOUGH_RESOURCES	-6	The target does not have the given amount of resources.
ERR_INVALID_TARGET	-7	The target is not a valid object which can contain the specified resource.
ERR_FULL	-8	The creep's store is full.
ERR_NOT_IN_RANGE	-9	The target is too far away.
ERR_INVALID_ARGS	-10	The resourceType is not one of the RESOURCE_* constants, or the amount is incorrect.

if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    creep.moveTo(container);
}

Flag

class extends GameObject

A flag is a game object that control other objects.
my

boolean

Equals to true or false if the flag is owned. Returns undefined if it is neutral.
GameObject

class 

Basic prototype for game objects. All objects and classes are inherited from this class.
controlledBy

Returns the flag object that controls this game object.
exists

boolean

Returns true if this object is live in the game at the moment. Check this property to verify cached or newly created object instances.
id

string

The unique ID of this object that you can use in getObjectById.
ticksToDecay

number

If defined, then this object will disappear after this number of ticks.
x

number

The X coordinate in the room.
y

number

The Y coordinate in the room.
findClosestByPath(positions, [opts])

Find a position with the shortest path from this game object. (See  findClosestByPath.)
parameter	type	description
positions 	

array
	The positions to search among. An array with GameObjects or any objects containing x and y properties.
opts (optional)	

object
	An object containing additional pathfinding flags supported by searchPath method.

Returns the closest object from positions, or null if there was no valid positions.
findClosestByRange(positions)

Find a position with the shortest linear distance from this game object. (See  findClosestByRange).
parameter	type	description
positions 	

array
	The positions to search among. An array with GameObjects or any objects containing x and y properties.

Returns the closest object from positions.
findInRange(positions, range)

Find all objects in the specified linear range. See  findInRange.
parameter	type	description
positions 	

array
	The positions to search. An array with GameObjects or any objects containing x and y properties.
range 	

number
	The range distance.

Returns an array with the objects found.
findPathTo(pos, [opts])

Find a path from this object to the given position.
parameter	type	description
pos 	

object
	An object containing x and y.
opts (optional)	

object
	An object with additional options that are passed to  findPath.

Returns the path found as an array of objects containing x and y properties

let path = creep.findPathTo(spawn);
console.log(path.length);

getRangeTo(pos)

See  getRange.
parameter	type	description
pos 	

object
	An object containing x and y.
OwnedStructure

class extends Structure

The base prototype for a structure that has an owner.

import { getObjectsByPrototype } from 'game/utils';
import { Creep, StructureSpawn } from 'game/prototypes';

export function loop() {
    let target = getObjectsByPrototype(StructureSpawn).find(i => !i.my);
}

my

boolean

Returns true for your structure, false for a hostile structure, undefined for a neutral structure.
Resource

class extends GameObject

A dropped piece of resource. It will decay after a while if not picked up. Dropped resource pile decays for ceil(amount/1000) units per tick.
amount

number

The amount of dropped resource.
resourceType

string

One of the RESOURCE_* constants.
Source

class extends GameObject

An energy source object. Can be harvested by creeps with a WORK body part.
Energy amount	1000
Energy regeneration	10 energy per tick
energy

number

Current amount of energy in the source.
energyCapacity

number

The maximum amount of energy in the source.
Spawning

object 

Details of the creep being spawned currently that can be addressed by the StructureSpawn.spawning property.
creep

The creep that being spawned.
needTime

number

Time needed in total to complete the spawning.
remainingTime

number

Remaining time to go.
cancel()

Cancel spawning immediately. Energy spent on spawning is not returned.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this spawn.
Store

object 

An object that class contain resources in its cargo.

There are two types of stores in the game: general-purpose stores and limited stores.

    General purpose stores can contain any resource within their capacity (e.g. creeps or containers).
    Limited stores can contain only a few types of resources needed for that particular object (e.g. spawns, extensions, towers).

You can get specific resources from the store by addressing them as object properties:

console.log(creep.store[RESOURCE_ENERGY]);

getCapacity([resource])

Returns capacity of this store for the specified resource. For a general-purpose store, it returns total capacity if resource is undefined.
parameter	type	description
resource (optional)	

RESOURCE_ENERGY
	

if (creep.store[RESOURCE_ENERGY] < creep.store.getCapacity()) {
    creep.harvest(source);
}

getFreeCapacity([resource])

Returns free capacity for the store. For a limited store, it returns the capacity available for the specified resource if resource is defined and valid for this store.
parameter	type	description
resource (optional)	

RESOURCE_ENERGY
	

if (tower.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.transfer(tower, RESOURCE_ENERGY);
}

getUsedCapacity([resource])

Returns the capacity used by the specified resource. For a general-purpose store, it returns total used capacity if resource is undefined.
parameter	type	description
resource (optional)	

RESOURCE_ENERGY
	

if (container.store.getUsedCapacity() == 0) {
    // the container is empty
}

Structure

class extends GameObject

The base prototype object of all structures.

import { getObjectsByPrototype } from 'game/utils';
import { Structure } from 'game/prototypes';

export function loop() {
    let structures = getObjectsByPrototype(Structure).filter(i => i.hits < i.hitsMax);
    console.log(structures.length);
}

hits

number

The current amount of hit points of the structure.
hitsMax

number

The maximum amount of hit points of the structure.
StructureContainer

class extends OwnedStructure

A small container that can be used to store resources. This is a walkable structure. All dropped resources automatically goes to the container at the same tile.
capacity	2000
cost	100
hits	300
store

Store

A Store object that contains cargo of this structure.
StructureExtension

class extends OwnedStructure

Contains energy that can be spent on spawning bigger creeps. Extensions can be placed anywhere, any spawns will be able to use them regardless of distance.
cost	200
hits	100
capacity	100

let allExtensions = getObjectsByPrototype(StructureExtension);
let myEmptyExtensions = allExtensions.filter(e => e.my && e.store.getUsedCapacity(RESOURCE_ENERGY) == 0)
let closestEmptyExtension = creep.findClosestByRange(myEmptyExtensions);
creep.moveTo(closestEmptyExtension);

store

A Store object that contains cargo of this structure.
StructureRampart

class extends OwnedStructure

Blocks movement of hostile creeps, and defends your creeps and structures on the same position.
cost	200
hits	10000
StructureRoad

class extends Structure

Decreases movement cost to 1. Using roads allows creating creeps with less MOVE body parts.
cost	

    10 on plain land
    50 on swamp

hits	

    500 on plain land
    2500 on swamp

StructureSpawn

class extends OwnedStructure

This structure can create creeps. It also auto-regenerate a little amount of energy each tick.
cost	3000
hits	3000
capacity	1000
Spawn time	3 ticks per each body part
directions

array<number>

An array with the direction constants:TOP TOP_RIGHT RIGHT BOTTOM_RIGHT BOTTOM BOTTOM_LEFT LEFT TOP_LEFT 
spawning

If the spawn is in process of spawning a new creep, this object will contain a Spawning object, or null otherwise.
store

A Store object that contains cargo of this structure.
setDirections(directions)

Set desired directions where creeps should move when spawned.
parameter	type	description
directions 	

array<number>
	An array with the direction constants:TOP TOP_RIGHT RIGHT BOTTOM_RIGHT BOTTOM BOTTOM_LEFT LEFT TOP_LEFT 

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this structure.
ERR_INVALID_ARGS	-10	The array contains invalid directions.

import { getObjectsByPrototype } from 'game/utils';
import { StructureSpawn } from 'game/prototypes';

export function loop() {
    const mySpawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
    mySpawn.setDirections([TOP, TOP_RIGHT, RIGHT]);
}

spawnCreep(body)

Start the creep spawning process. The required energy amount can be withdrawn from all your spawns and extensions in the game.
parameter	type	description
body 	

array<string>
	An array describing the new creep’s body. Should contain 1 to 50 elements with one of these constants: WORK MOVE CARRY ATTACK RANGED_ATTACK HEAL TOUGH

Return an object with one of the following properties:
error	number	One of the ERR_* constants
object	Creep	Instance of the creep being spawned

Possible error codes:
ERR_NOT_OWNER	-1	You are not the owner of this structure.
ERR_BUSY	-4	The spawn is already in process of spawning another creep.
ERR_NOT_ENOUGH_ENERGY	-6	The spawn and its extensions contain not enough energy to create a creep with the given body.
ERR_INVALID_ARGS	-10	Body is not properly described.

import { getObjectsByPrototype } from 'game/utils';
import { StructureSpawn } from 'game/prototypes';

export function loop() {
    const mySpawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
    const creep = mySpawn.spawnCreep([WORK, CARRY, MOVE]).object;
}

StructureTower

class extends OwnedStructure

Remotely attacks game objects or heals creeps within its range. Its effectiveness linearly depends on the distance. Each action consumes energy.
cost	1250
hits	3000
capacity	50
cooldown	10 ticks
Action maximum range	50
Energy per action	10
Attack effectiveness	150 hits at range ≤5 to 37 hits at range ≥20
Heal effectiveness	100 hits at range ≤5 to 25 hits at range ≥20
cooldown

number

The remaining amount of ticks while this tower cannot be used.
store

A Store object that contains cargo of this structure.
attack(target)

Remotely attack any creep or structure in range.
parameter	type	description
target 	

Creep

Structure
	The target object.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this structure.
ERR_NOT_ENOUGH_ENERGY	-6	The tower does not have enough energy.
ERR_INVALID_TARGET	-7	The arguments provided are incorrect.
ERR_TIRED	-11	The tower is still cooling down.

import { getObjectsByPrototype } from 'game/utils';
import { Creep } from 'game/prototypes';
import { TOWER_RANGE } from 'game/constants';

export function loop() {
    let target = tower.findClosestByRange(getObjectsByPrototype(Creep).filter(i => !i.my));
    if (tower.getRangeTo(target) <= TOWER_RANGE) {
        tower.attack(target);
    }
}

heal(target)

Remotely heal any creep in range.
parameter	type	description
target 	

Creep
	The target creep.

Return one of the following codes:
OK	0	The operation has been scheduled successfully.
ERR_NOT_OWNER	-1	You are not the owner of this structure.
ERR_NOT_ENOUGH_ENERGY	-6	The tower does not have enough energy.
ERR_INVALID_TARGET	-7	The arguments provided are incorrect.
ERR_TIRED	-11	The tower is still cooling down.

let creeps = getObjectsByPrototype(Creep);
let myDamagedCreeps = creeps.filter(i => i.my && i.hits < i.hitsMax);
let target = tower.findClosestByRange(myDamagedCreeps);
if (creep.heal(target) == ERR_NOT_IN_RANGE) {
    creep.moveTo(target);
}

StructureWall

class extends Structure

Blocks movement of all creeps.
cost	100
hits	10000
Visual

class 

Visuals provide a way to show various visual debug info in the game. All draw coordinates are measured in game coordinates and centered to tile centers, i.e. (10,10) will point to the center of the creep at x:10; y:10 position. Fractional coordinates are allowed.
layer

number

The layer of visuals in the object.
persistent

boolean

Whether visuals in this object are persistent.
circle(pos, [style])

Draw a circle.
parameter	type	description
pos 	

object
	The position object of the center. May be GameObject or any object containing x and y properties.
style (optional)	

object
	An object with the following properties:

    radius (number) Circle radius, default is 0.15.
    fill (string) Fill color in the following format: #ffffff (hex triplet). Default is #ffffff.
    opacity (number) Opacity value, default is 0.5.
    stroke (string) Stroke color in the following format: #ffffff (hex triplet). Default is #ffffff.
    strokeWidth (number) Stroke line width, default is 0.1.
    lineStyle (string) Either undefined (solid line), dashed, or dotted. Default is undefined.

Returns the Visual object itself, so that you can chain calls.
clear()

Remove all visuals from the object.

Returns the Visual object itself, so that you can chain calls.
constructor([layer], persistent)

Creates a new empty instance of Visual.
parameter	type	description
layer (optional)	

number
	The layer of visuals in this object. Visuals of higher layer overlaps visuals of lower layer. Default is 0.
persistent 	

boolean
	Whether visuals in this object are persistent. Non-persistent visuals are visible during the current tick only.

for(const creep of creeps) {
    if(!creep.hitsVisual) {
        creep.hitsVisual = new Visual(10, true);
    }
    creep.hitsVisual.clear().text(
        creep.hits,
        { x: creep.x, y: creep.y - 0.5 }, // above the creep
        {
            font: '0.5',
            opacity: 0.7,
            backgroundColor: '#808080',
            backgroundPadding: '0.03'
        });
}

line(pos1, pos2, [style])

Draw a line.
parameter	type	description
pos1 	

object
	The start position object. May be GameObject or any object containing x and y properties.
pos2 	

object
	The finish position object. May be GameObject or any object containing x and y properties.
style (optional)	

object
	An object with the following properties:

    width (number) Line width, default is 0.1.
    color (string) Line color in the following format: #ffffff (hex triplet). Default is #ffffff.
    opacity (number) Opacity value, default is 0.5.
    lineStyle (string) Either undefined (solid line), dashed, or dotted. Default is undefined.

Returns the Visual object itself, so that you can chain calls.

new Visual().line({x: 1, y: 99}, {x: 99, y: 1}, {color: '#ff0000'});
new Visual().line(creep, tower, {lineStyle: 'dashed'});

poly(points, [style])

Draw a polyline.
parameter	type	description
points 	

array
	An array of points. Every item may be GameObject or any object containing x and y properties.
style (optional)	

object
	An object with the following properties:

    fill (string) Fill color in the following format: #ffffff (hex triplet). Default is #ffffff.
    opacity (number) Opacity value, default is 0.5.
    stroke (string) Stroke color in the following format: #ffffff (hex triplet). Default is #ffffff.
    strokeWidth (number) Stroke line width, default is 0.1.
    lineStyle (string) Either undefined (solid line), dashed, or dotted. Default is undefined.

Returns the Visual object itself, so that you can chain calls.
rect(pos, w, h, [style])

Draw a rectangle.
parameter	type	description
pos 	

object
	The position object of the top-left corner. May be GameObject or any object containing x and y properties.
w 	

number
	The width of the rectangle.
h 	

number
	The height of the rectangle.
style (optional)	

object
	An object with the following properties:

    fill (string) Fill color in the following format: #ffffff (hex triplet). Default is #ffffff.
    opacity (number) Opacity value, default is 0.5.
    stroke (string) Stroke color in the following format: #ffffff (hex triplet). Default is #ffffff.
    strokeWidth (number) Stroke line width, default is 0.1.
    lineStyle (string) Either undefined (solid line), dashed, or dotted. Default is undefined.

Returns the Visual object itself, so that you can chain calls.
size()

Get the stored size of all visuals stored in the object.

Returns the size of the visuals in bytes.
text(text, pos, [style])

Draw a text label. You can use any valid Unicode characters, including emoji.
parameter	type	description
text 	

string
	The text message.
pos 	

object
	The position object of the label baseline. May be GameObject or any object containing x and y properties.
style (optional)	

object
	An object with the following properties:

    color (string) Font color in the following format: #ffffff (hex triplet). Default is #ffffff.
    font (number|string) Either a number or a string in one of the following forms: "0.7" (relative size in game coordinates), "20px" (absolute size in pixels), "0.7 serif", or "bold italic 1.5 Times New Roman"
    stroke (string) Stroke color in the following format: #ffffff (hex triplet). default is undefined (no stroke).
    strokeWidth (number) Stroke line width, default is 0.15.
    backgroundColor (string) Background color in the following format: #ffffff (hex triplet). Default is undefined (no background). When background is enabled, text vertical align is set to middle (default is baseline).
    backgroundPadding (number) Background rectangle padding, default is 0.3.
    aling (string) Text align, either center, left, or right. Default is center.
    opacity (number) Opacity value, default is 1.

The Visual object itself, so that you can chain calls.
arenaInfo

object 

import { arenaInfo } from 'game';
export function loop() {
    console.log(arenaInfo.name);
}

cpuTimeLimit

number

CPU wall time execution limit per one tick (except the first tick).
cpuTimeLimitFirstTick

number

CPU wall time limit on the first tick.
level

number

Currently equals to 1 for basic arena and 2 for advanced.
name

string

The name of the arena.
season

string

The name of the season this arena belongs.
ticksLimit

number

Game ticks limit.
createConstructionSite(position, prototype)

Create new ConstructionSite at the specified location.
parameter	type	description
position 	

object
	An object with x and y properties.
prototype 	

class
	A prototype that extends Structure.

Returns an object with one of the following properties:
error	number	one of the ERR_* constants
object	ConstructionSite	the instance of ConstructionSite created by this call

Possible error codes:
ERR_INVALID_ARGS	-10	The location or the structure prototype is incorrect.
ERR_INVALID_TARGET	-7	The structure cannot be placed at the specified location.
ERR_FULL	-8	You have too many construction sites. The maximum number of construction sites per player is 10.
findClosestByPath(fromPos, positions, [opts])

Find a position with the shortest path from the given position.
parameter	type	description
fromPos 	

object
	The position to search from. May be GameObject or any object containing x and y properties.
positions 	

array
	The positions to search among. An array with GameObjects or any objects containing x and y properties.
opts (optional)	

object
	An object containing additional pathfinding flags supported by searchPath method.

The closest object if found, null otherwise.

let targets = getObjectsByPrototype(Creep).filter(c => !c.my);
let closestTarget = findClosestByPath(creep, targets);
creep.moveTo(closestTarget);
creep.attack(closestTarget);

findClosestByRange(fromPos, positions)

Find a position with the shortest linear distance from the given position.
parameter	type	description
fromPos 	

object
	The position to search from. May be GameObject or any object containing x and y properties.
positions 	

array
	The positions to search among. An array with GameObjects or any objects containing x and y properties.

Returns the closest object from positions, or null if there was no valid positions.

let targets = getObjectsByPrototype(Creep).filter(c => !c.my);
let closestTarget = findClosestByRange(tower, targets);
tower.attack(closestTarget);

findInRange(fromPos, positions, range)

Find all objects in the specified linear range.
parameter	type	description
fromPos 	

object
	The origin position. May be GameObject or any object containing x and y properties.
positions 	

array
	The positions to search. An array with GameObjects or any objects containing x and y properties.
range 	

number
	The range distance.

Returns an array with the objects found.

let targets = getObjectsByPrototype(Creep).filter(c => !c.my);
let targetsInRange = findInRange(creep, targets, 3);
if (targetsInRange.length >= 3) {
    creep.rangedMassAttack();
} else if (targetsInRange.length > 0) {
    creep.rangedAttack(targetsInRange[0]);
}

findPath(fromPos, toPos, [opts])

Find an optimal path between fromPos and toPos. Unlike searchPath, findPath avoid all obstacles by default (unless costMatrix is specified).
parameter	type	description
fromPos 	

object
	The start position. May be GameObject or any object containing x and y properties.
toPos 	

object
	The target position. May be GameObject or any object containing x and y properties.
opts (optional)	

object
	An object containing additional pathfinding flags:

    ignore array (objects which should not be treated as obstacles during the search)
    Any options supported by searchPath method

Returns the path found as an array of objects containing x and y properties
getCpuTime()

Get CPU wall time elapsed in the current tick in nanoseconds.

import { getCpuTime } from 'game/utils';
import { arenaInfo } from 'game';
export function loop() {
    if( arenaInfo.cpuTimeLimit - getCpuTime() < 1000000) {
        // Less than 1 ms left before timeout!
    }
}

getDirection(dx, dy)

Get linear direction by differences of x and y.
parameter	type	description
dx 	

number
	The difference of X coordinate.
dy 	

number
	The difference of Y coordinate.

Returns a number representing one of the direction constants.

let pos = path.findIndex(p => p.x == creep.x && p.y == creep.y);
let direction = getDirection(path[pos+1].x-path[pos].x, path[pos+1].y-path[pos].y);
creep.move(direction);

getHeapStatistics()

Use this method to get heap statistics for your virtual machine. The return value is almost identical to the Node.js function v8.getHeapStatistics. This function returns one additional property: externally_allocated_size which is the total amount of currently allocated memory which is not included in the v8 heap but counts against this isolate's memory limit. ArrayBuffer instances over a certain size are externally allocated and will be counted here.

import { getHeapStatistics } from 'game/utils';

export function loop() {
    let heap = getHeapStatistics();
    console.log(`Used ${heap.total_heap_size} / ${heap.heap_size_limit}`);
}

getObjectById(id)

Get an object with the specified unique ID.
parameter	type	description
id 	

string
	The id property of the needed object. See GameObject prototype.

import { getObjectById } from 'game/utils';
export function loop() {
    runCreep(myCreep.id);
}
function runCreep(id) {
    let creep = getObjectById(id);
    creep.move(RIGHT);
}

getObjects()

Get all game objects in the game.

Returns an array of GameObject.
getObjectsByPrototype(prototype)

Get all objects in the game with the specified prototype, for example, all creeps.
parameter	type	description
prototype 	

class
	A prototype that extends GameObject.

Returns an array of GameObject of the given prototype.

import { getObjectsByPrototype } from 'game/utils';
import { Creep } from 'game/prototypes';

export function loop() {
    const creeps = getObjectsByPrototype(Creep);

    creeps.forEach(function(myCreep) {
        runCreep(myCreep);
    });
}

function runCreep(creep) {
    if(creep.my) {
        creep.move(RIGHT);
    }
}

getRange(a, b)

Get linear range between two objects. a and b may be any object containing x and y properties.
parameter	type	description
a 	

object
	The first of two objects. May be GameObject or any object containing x and y properties.
b 	

object
	The second of two objects. May be GameObject or any object containing x and y properties.

Returns a number of squares between two objects.

let range = getRange(creep, target);
if(range <= 3) {
    creep.rangedAttack(target);
}

getTerrainAt(pos)

Get an integer representation of the terrain at the given position.
parameter	type	description
pos 	

object
	The position as an object containing x and y properties.

Returns TERRAIN_WALL,TERRAIN_SWAMP, orTERRAIN_PLAIN.

let matrix = new CostMatrix;
// Fill CostMatrix with full-speed terrain costs for future analysis:
for(let y = 0; y < 100; y++) {
    for(let x = 0; x < 100; x++) {
        let tile = getTerrainAt({x: x, y: y});
        let weight =
            tile === TERRAIN_WALL  ? 255 : // wall  => unwalkable
            tile === TERRAIN_SWAMP ?   5 : // swamp => weight:  5
                                            1 ; // plain => weight:  1
        matrix.set(x, y, weight);
    }
}

getTicks()

The number of ticks passed from the start of the current game.

import { getTicks } from 'game';
export function loop() {
    console.log(getTicks());
}

searchPath(origin, goal, [opts])

Find an optimal path between origin and goal. Note that searchPath without costMatrix specified (see below) uses terrain data only.
parameter	type	description
origin 	

object
	See below
goal 	

object
	See below
opts (optional)	

object
	See below

A goal is either an object containing x and y properties or an object as defined below.

If more than one goal is supplied (as an array of goals) then the cheapest path found out of all the goals will be returned.
property	type	description
pos	object	an object containing x and y properties
range	number	range to pos before the goal is considered reached. The default is 0

opts is an object containing additional pathfinding flags:
property	type	description
costMatrix	CostMatrix	Custom navigation cost data
plainCost	number	Cost for walking on plain positions. The default is 2
swampCost	number	Cost for walking on swamp positions. The default is 10
flee	boolean	Instead of searching for a path to the goals this will search for a path away from the goals. The cheapest path that is out of range of every goal will be returned. The default is false
maxOps	number	The maximum allowed pathfinding operations. The default value is 50000
maxCost	number	The maximum allowed cost of the path returned. The default is Infinity
heuristicWeight	number	Weight from 1 to 9 to apply to the heuristic in the A* formula F = G + weight * H. The default value is 1.2

Returns an object containing the following properties:
path	array	The path found as an array of objects containing x and y properties
ops	number	Total number of operations performed before this path was calculated
cost	number	The total cost of the path as derived from plainCost, swampCost, and given CostMatrix instance
incomplete	boolean	If the pathfinder fails to find a complete path, this will be true

import { searchPath } from 'game/path-finder';
import { getObjectsByPrototype } from 'game/utils';

export function loop() {
    let target = getObjectsByPrototype(StructureSpawn).find(i => !i.my);
    let creep = getObjectsByPrototype(Creep).find(i => i.my);

    let ret = searchPath(creep, target);
    console.log(ret.cost); // total cost
    console.log(ret.path.length); // tiles count
}

AreaEffect

class extends GameObject

An object that applies an effect of the specified type to all creeps at the same tile.
effect

string

One of the following constants: EFFECT_SLOWDOWN.
ConstructionBoost

class extends GameObject

An object that provides a construction boost effect to the creep that steps onto this object for 200 ticks.
ticksToDecay

number

The number of ticks until this construction boost decays and disappears.
StructureGoal

class extends Structure

A structure that needs to be built to win the match.
AreaEffect

class extends GameObject

An object that applies an effect of the specified type to all creeps at the same tile.
effect

string

One of the following constants: EFFECT_SLOWDOWN.
kind

string

One of the following constants: KIND_RED, KIND_BLUE, KIND_GREEN.
ConstructionBoost

class extends GameObject

An object that provides a construction boost effect to the creep that steps onto this object for 200 ticks.
ticksToDecay

number

The number of ticks until this construction boost decays and disappears.
EFFECT_CONSTRUCTION_BOOST

eff_construction_boost
EFFECT_SLOWDOWN

slowdown
KIND_BLUE

blue
KIND_GREEN

green
KIND_RED

red
StructureGoal

class extends Structure

A structure that needs to be built to win the match.
Portal

class extends GameObject

An object that teleports a creep on the same tile elsewhere. The destination is accessible via the destination property.
destination

object

The destination coordinates where the creep will be teleported. Contains x and y properties.
Portal

class extends GameObject

An object that teleports a creep on the same tile elsewhere. The destination is not accessible in this mode.
ATTACK

attack
ATTACK_POWER

30
BODYPART_HITS

100
BOTTOM

5
BOTTOM_LEFT

6
BOTTOM_RIGHT

4
BUILD_POWER

5
CARRY

carry
CARRY_CAPACITY

50
CONSTRUCTION_COST_ROAD_SWAMP_RATIO

5
CONSTRUCTION_COST_ROAD_WALL_RATIO

150
CONTAINER_CAPACITY

2000
CONTAINER_HITS

300
CREEP_SPAWN_TIME

3
DISMANTLE_COST

0.005
DISMANTLE_POWER

50
ERR_BUSY

-4
ERR_FULL

-8
ERR_INVALID_ARGS

-10
ERR_INVALID_TARGET

-7
ERR_NAME_EXISTS

-3
ERR_NOT_ENOUGH_ENERGY

-6
ERR_NOT_ENOUGH_EXTENSIONS

-6
ERR_NOT_ENOUGH_RESOURCES

-6
ERR_NOT_FOUND

-5
ERR_NOT_IN_RANGE

-9
ERR_NOT_OWNER

-1
ERR_NO_BODYPART

-12
ERR_NO_PATH

-2
ERR_TIRED

-11
EXTENSION_ENERGY_CAPACITY

100
EXTENSION_HITS

100
HARVEST_POWER

2
HEAL

heal
HEAL_POWER

12
LEFT

7
MAX_CONSTRUCTION_SITES

10
MAX_CREEP_SIZE

50
MOVE

move
OBSTACLE_OBJECT_TYPES

['creep','tower','constructedWall','spawn','extension','link']
OK

0
RAMPART_HITS

10000
RAMPART_HITS_MAX

10000
RANGED_ATTACK

ranged_attack
RANGED_ATTACK_DISTANCE_RATE

{0: 1, 1: 1, 2: 0.4, 3: 0.1}
RANGED_ATTACK_POWER

10
RANGED_HEAL_POWER

4
REPAIR_COST

0.01
REPAIR_POWER

100
RESOURCES_ALL

[RESOURCE_ENERGY]
RESOURCE_DECAY

1000
RESOURCE_ENERGY

energy
RIGHT

3
ROAD_HITS

500
ROAD_WEAROUT

1
SOURCE_ENERGY_REGEN

10
SPAWN_ENERGY_CAPACITY

1000
SPAWN_HITS

3000
TERRAIN_PLAIN

0
TERRAIN_SWAMP

2
TERRAIN_WALL

1
TOP

1
TOP_LEFT

8
TOP_RIGHT

2
TOUGH

tough
TOWER_CAPACITY

50
TOWER_COOLDOWN

10
TOWER_ENERGY_COST

10
TOWER_FALLOFF

0.75
TOWER_FALLOFF_RANGE

20
TOWER_HITS

3000
TOWER_OPTIMAL_RANGE

5
TOWER_POWER_ATTACK

150
TOWER_POWER_HEAL

100
TOWER_POWER_REPAIR

200
TOWER_RANGE

50
WALL_HITS

10000
WALL_HITS_MAX

10000
WORK

work
