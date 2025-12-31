import { getObjectsByPrototype } from 'game/utils';
import { Creep, StructureSpawn, StructureRampart, StructureExtension, Source, ConstructionSite } from 'game/prototypes';
import { MapTopology } from '../constants.mjs';

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
        this.fortifiedMiner = null; // Cached detection of enemy miner on rampart near corner
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
        
        // Cache fortified miner detection
        this.fortifiedMiner = this._detectFortifiedMiner();
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
     * Get friendly ramparts (ramparts that belong to us).
     * @returns {StructureRampart[]}
     */
    getMyRamparts() {
        return this.ramparts.filter(r => r.my);
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
    
    /**
     * Detect if there's an enemy miner on a rampart near a corner source.
     * A "miner" is defined as a creep with WORK parts.
     * A "corner source" is one with y < 30 or y > 70.
     * @returns {Object|null} Object with {creep, rampart, source} if detected, null otherwise
     * @private
     */
    _detectFortifiedMiner() {
        // Filter corner sources
        const cornerSources = this.sources.filter(source => 
            source.y < MapTopology.CORNER_TOP_THRESHOLD || 
            source.y > MapTopology.CORNER_BOTTOM_THRESHOLD
        );
        
        if (cornerSources.length === 0) {
            return null;
        }
        
        // Get enemy ramparts (ramparts that don't belong to us)
        const enemyRamparts = this.ramparts.filter(r => !r.my);
        
        if (enemyRamparts.length === 0) {
            return null;
        }
        
        // Create a map of rampart positions for efficient lookup
        const rampartPositions = new Map();
        enemyRamparts.forEach(rampart => {
            rampartPositions.set(`${rampart.x},${rampart.y}`, rampart);
        });
        
        // Check each enemy creep to see if it's a miner on a rampart near a corner source
        for (const creep of this.enemyCreeps) {
            // Check if this creep has WORK parts (is a miner)
            const hasWorkParts = creep.body.some(bodyPart => bodyPart.type === 'work');
            if (!hasWorkParts) {
                continue;
            }
            
            // Check if this creep is on an enemy rampart
            const posKey = `${creep.x},${creep.y}`;
            const rampart = rampartPositions.get(posKey);
            if (!rampart) {
                continue;
            }
            
            // Check if this creep is near a corner source (within range 2)
            for (const source of cornerSources) {
                const dx = Math.abs(creep.x - source.x);
                const dy = Math.abs(creep.y - source.y);
                const distance = Math.max(dx, dy); // Chebyshev distance
                
                if (distance <= 2) {
                    // Found a fortified miner!
                    return {
                        creep: creep,
                        rampart: rampart,
                        source: source
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get the fortified miner detection result.
     * Returns an object with {creep, rampart, source} if a fortified miner is detected.
     * @returns {Object|null} Fortified miner info or null if none detected
     */
    getFortifiedMiner() {
        return this.fortifiedMiner;
    }
}
