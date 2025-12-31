/**
 * Utility functions for combat logic shared across multiple combat jobs.
 */
export class CombatUtils {
    /**
     * Filter enemies by rampart status.
     * Separates enemies into those on ramparts and those not on ramparts.
     * 
     * @param {Creep[]} enemies - Array of enemy creeps
     * @param {StructureRampart[]} ramparts - Array of rampart structures
     * @returns {Object} Object with enemiesNotOnRamparts and enemiesOnRamparts arrays
     */
    static filterEnemiesByRampartStatus(enemies, ramparts) {
        // Create a set of rampart positions for efficient lookup
        const rampartPositions = new Set(ramparts.map(r => `${r.x},${r.y}`));
        
        const enemiesNotOnRamparts = [];
        const enemiesOnRamparts = [];
        
        enemies.forEach(enemy => {
            const onRampart = rampartPositions.has(`${enemy.x},${enemy.y}`);
            if (onRampart) {
                enemiesOnRamparts.push(enemy);
            } else {
                enemiesNotOnRamparts.push(enemy);
            }
        });
        
        return {
            enemiesNotOnRamparts,
            enemiesOnRamparts
        };
    }
    
    /**
     * Filter out enemies that are standing on ramparts.
     * Returns only enemies that can be targeted by melee attacks.
     * 
     * @param {Creep[]} enemies - Array of enemy creeps
     * @param {StructureRampart[]} ramparts - Array of rampart structures
     * @returns {Creep[]} Array of enemies not on ramparts
     */
    static filterMeleeTargetableEnemies(enemies, ramparts) {
        return enemies.filter(enemy => {
            // Check if any rampart is at the same position as this enemy
            const onRampart = ramparts.some(rampart => 
                rampart.x === enemy.x && rampart.y === enemy.y
            );
            return !onRampart;
        });
    }
}
