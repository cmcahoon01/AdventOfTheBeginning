import { getObjectsByPrototype } from 'game/utils';
import { Creep, StructureSpawn, StructureRampart, StructureExtension, Source, ConstructionSite } from 'game/prototypes';

/**
 * GameState service that caches expensive game object queries per tick.
 * This reduces redundant getObjectsByPrototype calls across multiple modules.
 * 
 * Usage:
 *   const gameState = new GameState();
 *   gameState.refresh(); // Call once per tick
 *   const mySpawn = gameState.getMySpawn();
 *   const enemies = gameState.getEnemyCreeps();
 */
export class GameState {
    constructor() {
        this.mySpawn = null;
        this.enemySpawn = null;
        this.myCreeps = [];
        this.enemyCreeps = [];
        this.allCreeps = [];
        this.ramparts = [];
        this.myExtensions = [];
        this.sources = [];
        this.myConstructionSites = [];
    }
    
    /**
     * Refresh all cached values. Should be called once per game tick.
     */
    refresh() {
        // Cache all creeps
        this.allCreeps = getObjectsByPrototype(Creep);
        this.myCreeps = this.allCreeps.filter(c => c.my);
        this.enemyCreeps = this.allCreeps.filter(c => !c.my);
        
        // Cache spawns
        const spawns = getObjectsByPrototype(StructureSpawn);
        this.mySpawn = spawns.find(s => s.my) || null;
        this.enemySpawn = spawns.find(s => !s.my) || null;
        
        // Cache ramparts
        this.ramparts = getObjectsByPrototype(StructureRampart);
        
        // Cache extensions
        const allExtensions = getObjectsByPrototype(StructureExtension);
        this.myExtensions = allExtensions.filter(e => e.my);
        
        // Cache sources
        this.sources = getObjectsByPrototype(Source);
        
        // Cache construction sites
        const allConstructionSites = getObjectsByPrototype(ConstructionSite);
        this.myConstructionSites = allConstructionSites.filter(c => c.my);
    }
    
    /**
     * Get the player's spawn.
     * @returns {StructureSpawn|null}
     */
    getMySpawn() {
        return this.mySpawn;
    }
    
    /**
     * Get the enemy's spawn.
     * @returns {StructureSpawn|null}
     */
    getEnemySpawn() {
        return this.enemySpawn;
    }
    
    /**
     * Get all friendly creeps.
     * @returns {Creep[]}
     */
    getMyCreeps() {
        return this.myCreeps;
    }
    
    /**
     * Get all enemy creeps.
     * @returns {Creep[]}
     */
    getEnemyCreeps() {
        return this.enemyCreeps;
    }
    
    /**
     * Get all creeps (friendly and enemy).
     * @returns {Creep[]}
     */
    getAllCreeps() {
        return this.allCreeps;
    }
    
    /**
     * Get all ramparts.
     * @returns {StructureRampart[]}
     */
    getRamparts() {
        return this.ramparts;
    }
    
    /**
     * Get all friendly extensions.
     * @returns {StructureExtension[]}
     */
    getMyExtensions() {
        return this.myExtensions;
    }
    
    /**
     * Get all sources.
     * @returns {Source[]}
     */
    getSources() {
        return this.sources;
    }
    
    /**
     * Get all friendly construction sites.
     * @returns {ConstructionSite[]}
     */
    getMyConstructionSites() {
        return this.myConstructionSites;
    }
}
