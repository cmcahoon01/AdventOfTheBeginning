# Tiered Jobs System

## Overview

The tiered jobs system allows creeps with the same job to have different body configurations (tiers). This enables progressive scaling of unit capabilities without changing their behavior logic.

## Key Concepts

### What is a Tier?

A tier represents a specific body configuration for a job. For example:
- **Tier 1 Miner**: `[WORK, WORK, CARRY]` - Basic miner (cost: 250 energy)
- **Tier 2 Miner**: `[WORK, WORK, WORK, WORK, CARRY]` - Advanced miner with more work parts (cost: 450 energy)

### Design Principles

1. **Same Behavior**: All tiers of a job execute the same logic via the same `act()` method
2. **Different Capabilities**: Body parts determine capabilities (e.g., more WORK parts = faster mining)
3. **Automatic Adaptation**: Jobs that reference body parts (like `MinerJob`) automatically adapt their calculations based on the instance's tier

## Using Tiered Jobs

### Defining Tiers for a Job

To add tier support to a job class, override the `getTierBody(tier)` static method:

```javascript
export class MinerJob extends ActiveCreep {
    static getTierBody(tier) {
        switch(tier) {
            case 1:
                return [WORK, WORK, CARRY]; // Basic miner
            case 2:
                return [WORK, WORK, WORK, WORK, CARRY]; // Advanced miner
            default:
                throw new Error(`Tier ${tier} not defined for MinerJob`);
        }
    }
    
    // ... rest of the class
}
```

### Configuring Build Order with Tiers

In `src/constants.mjs`, specify tiers in build configurations:

```javascript
export const BuildConfig = {
    ECONOMY_BUILD: [
        {job: 'miner', tier: 1},  // First miner is tier 1
        'tug',                     // String format defaults to tier 1
        'tug',
        {job: 'miner', tier: 2}   // Second miner is tier 2
    ],
};
```

**Format Options:**
- String format: `'miner'` - Defaults to tier 1
- Object format: `{job: 'miner', tier: 2}` - Specifies custom tier

### Accessing Tier Information

Within a job instance:

```javascript
act() {
    const creep = getObjectById(this.id);
    
    // Access the tier
    console.log(`This is a tier ${this.tier} ${this.jobName}`);
    
    // Get the body for this tier
    const body = this.getBody();
    
    // Calculate properties based on tier
    const workParts = body.filter(part => part === WORK).length;
}
```

## How It Works

### 1. ActiveCreep Base Class

The base class provides tier support infrastructure:

- **Constructor**: Accepts and stores `tier` parameter (defaults to 1)
- **getTierBody(tier)**: Static method that subclasses override to define tier bodies
- **getTierCost(tier)**: Static method that calculates cost from tier body
- **getBody()**: Instance method that returns the body for the creep's tier

### 2. Job Class Implementation

Job classes that want tier support:

1. Override `static getTierBody(tier)` to define body configurations
2. In constructor, calculate properties from `this.getBody()` instead of static `BODY`

**Example:**

```javascript
constructor(id, jobName, tier, controller, winObjective, gameState) {
    super(id, jobName, tier, controller, winObjective, gameState);
    
    // Calculate properties based on this creep's tier
    const body = this.getBody();
    this.workParts = body.filter(part => part === WORK).length;
    this.miningProduction = 2 * this.workParts;
}
```

### 3. Build Strategy

The `BuildStrategy` class:

1. Parses build configuration (supporting both string and object formats)
2. Calls `JobClass.getTierBody(tier)` and `JobClass.getTierCost(tier)` 
3. Returns `{job, tier, body, cost}` configuration

### 4. Spawn Queue

The `BuildQueue` class:

1. Receives tier from build strategy
2. Spawns creep with correct body
3. Tracks pending spawn with both job and tier
4. Passes tier to `ScreepController.addCreep()`

### 5. Creep Controller

The `ScreepController`:

1. Receives tier parameter in `addCreep()`
2. Passes tier to job class constructor
3. Job instance stores tier for its lifetime

## Benefits

### 1. Scalability

Easily add more powerful versions of units as economy grows:
- Early game: Tier 1 units (low cost, basic capabilities)
- Mid game: Tier 2 units (higher cost, better capabilities)
- Late game: Tier 3+ units (maximum capabilities)

### 2. Code Reusability

Same behavior logic works for all tiers:
- No need to duplicate job classes
- Changes to behavior affect all tiers automatically
- Reduces maintenance burden

### 3. Flexibility

Build orders can be easily tuned:
- Test different tier progressions
- Adapt to different maps or strategies
- Balance economy vs military investment

### 4. Type Safety

Static type checking helps prevent errors:
- `getTierBody()` throws error for undefined tiers
- Cost is automatically calculated from body
- Consistent interface across all jobs

## Examples

### Example 1: Miner Progression

```javascript
// constants.mjs
ECONOMY_BUILD: [
    {job: 'miner', tier: 1},  // 250 energy, 2 WORK parts
    'tug',
    'tug', 
    {job: 'miner', tier: 2}   // 450 energy, 4 WORK parts
]

// miner.mjs
static getTierBody(tier) {
    switch(tier) {
        case 1:
            return [WORK, WORK, CARRY];
        case 2:
            return [WORK, WORK, WORK, WORK, CARRY];
        default:
            throw new Error(`Tier ${tier} not defined for MinerJob`);
    }
}
```

Result: First miner mines at normal speed, second miner mines 2x faster.

### Example 2: Combat Unit Scaling

```javascript
// Future implementation example
static getTierBody(tier) {
    switch(tier) {
        case 1:
            return [MOVE, RANGED_ATTACK];              // 200 energy, basic archer
        case 2:
            return [MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK]; // 400 energy, more firepower
        case 3:
            return [MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, HEAL]; // 650 energy, self-healing
        default:
            throw new Error(`Tier ${tier} not defined for ArcherJob`);
    }
}
```

### Example 3: Default Tier Behavior

Jobs without tier support automatically use tier 1:

```javascript
// hauler.mjs - no getTierBody override
static get BODY() {
    return [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
}

// This works because ActiveCreep.getTierBody() returns BODY for tier 1
// and throws error for other tiers
```

## Adding Tier Support to Existing Jobs

To add tier support to a job that doesn't have it:

1. **Override getTierBody()**:
   ```javascript
   static getTierBody(tier) {
       switch(tier) {
           case 1:
               return this.BODY; // Keep existing tier 1 body
           case 2:
               return [...]; // Define tier 2 body
           default:
               throw new Error(`Tier ${tier} not defined for ${this.name}`);
       }
   }
   ```

2. **Update constructor if needed**:
   - If the job calculates properties from body parts, update to use `this.getBody()`
   - Example: `this.workParts = this.getBody().filter(part => part === WORK).length;`

3. **Configure build order**:
   - Add tier specifications to `BuildConfig` in `constants.mjs`

4. **Test**:
   - Run the bot and verify tier 1 still works
   - Check that higher tiers spawn with correct bodies
   - Confirm behavior is identical across tiers

## Troubleshooting

### "Tier X not defined" Error

**Problem**: Job doesn't support the requested tier.

**Solution**: Add the tier to the job's `getTierBody()` method, or change the build configuration to use a supported tier.

### Creep Not Spawning

**Problem**: Not enough energy for the tier's cost.

**Solution**: Check that energy income can support the cost of the tier. Use lower tiers early game.

### Wrong Body Parts

**Problem**: Creep spawned with unexpected body configuration.

**Solution**: Verify `getTierBody(tier)` returns correct body array. Check build configuration specifies correct tier.

## Future Enhancements

Potential improvements to the tier system:

1. **Dynamic Tier Selection**: Choose tier based on available energy or game state
2. **Tier Requirements**: Define prerequisites for higher tiers (e.g., need X energy storage)
3. **Tier Metadata**: Add tier descriptions, recommended use cases, etc.
4. **Tier Validation**: Compile-time checking of tier definitions
5. **Auto-scaling**: Automatically increase tiers as economy grows

## Related Files

- `src/jobs/ActiveCreep.mjs` - Base class with tier infrastructure
- `src/jobs/miner.mjs` - Example of tier support implementation
- `src/controllers/BuildStrategy.mjs` - Build order tier parsing
- `src/controllers/BuildQueue.mjs` - Spawn queue tier handling
- `src/controllers/ScreepController.mjs` - Creep controller tier passing
- `src/constants.mjs` - Build configuration with tier specifications
