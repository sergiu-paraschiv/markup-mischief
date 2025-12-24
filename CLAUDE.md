# MarkupMischief - Project Instructions

## Project Overview

MarkupMischief is an educational platformer game where players control a character and physically move HTML tag blocks around platforms. The goal is to arrange the blocks in the correct order so the theoretical HTML render output matches a target image.

## Technology Stack

- **Framework**: Angular 19 (standalone components)
- **Language**: TypeScript 5.6.3
- **Rendering**: HTML5 Canvas with 2D context
- **Physics**: Custom impulse-based physics engine
- **Asset Format**: Aseprite files (.aseprite) for sprites and animations
- **Build Tool**: Angular CLI with Vite

## Project Structure

```
src/
├── app/                    # Angular application entry point
├── engine/                 # Reusable game engine
│   ├── core/              # Element tree, scene management, events, vectors
│   ├── physics/           # Physics simulation, collision detection
│   ├── renderer/          # Canvas rendering system
│   ├── input/             # Keyboard/mouse input handling
│   ├── elements/          # 2D nodes, sprites, animations
│   └── loaders/           # Asset loading (Aseprite parser)
├── game/                  # Game-specific code
│   ├── entities/          # Game objects (character, tags, walls)
│   └── scenes/            # Game levels
├── editor/                # Level editor (WIP)
└── debugger/              # Debug visualization
```

## Key Architecture Patterns

### Event-Driven Communication
- All systems communicate via `EventEmitter`
- Events bubble up through the element tree hierarchy
- Custom event types: `PhysicsTickEvent`, `TickEvent`, `CharacterGrabEvent`, etc.

### Component Composition
- Inheritance hierarchy: `Element` → `Node2D` → `CollisionObject` → `DynamicBody`
- Parent-child relationships for spatial hierarchy
- Query system for tree traversal: `Query.childrenByType()`, `Query.parentByType()`

### Separation of Concerns
- **Render loop**: 200 FPS canvas updates (`CanvasRenderer.ts`)
- **Physics loop**: 200 FPS collision/movement (`PhysicsSimulation.ts`)
- **Logic**: Event-driven, decoupled from timing
- Each system has independent `WorkLoop`

### Impulse-Based Physics
- Movement uses accumulated impulse vectors, not direct velocity
- Collision response reduces impulse rather than bouncing
- Velocity calculated as: `impulse × deltaTime / 1000`
- Separate X/Y axis collision checks with AABB

## Game Mechanics

### Player Controls
- **Arrow Left/Right**: Horizontal movement
- **Arrow Up**: Jump (when grounded)
- **Arrow Down**: Drop through platforms
- **Spacebar**: Grab/release tag blocks

### Physics Values
- Horizontal impulse: 16 units/frame per arrow press
- Jump impulse: -288 (upward)
- Gravity: 1024 pixels/second²
- Drag coefficient: 0.85
- Grid size: 32 pixels

### Tag Block System
- Tag blocks are `DynamicBody` objects with physics
- Contain text strings (e.g., `"<em>"`, `"</em>"`, `"text"`)
- Can be grabbed and moved by the player
- One-way platform collision (can jump through from below)

### Win Condition
- Tags are sorted by position (Y first, then X)
- Their text is concatenated and compared to target
- Located in `GameLevelScene.ts:138-166`
- Currently validation exists but win state is not fully implemented

## Important Files

### Core Engine
- `/src/engine/Engine.ts` - Main game orchestrator
- `/src/engine/core/Element.ts` - Base class for all game objects
- `/src/engine/core/Scene.ts` - Container for game elements
- `/src/engine/physics/PhysicsSimulation.ts` - Collision system
- `/src/engine/physics/DynamicBody.ts` - Physics implementation
- `/src/engine/renderer/CanvasRenderer.ts` - Rendering pipeline
- `/src/engine/loaders/AssetsLoader.ts` - Asset management

### Game Logic
- `/src/game/scenes/GameLevelScene.ts` - Main game level and win condition
- `/src/game/entities/characters/CharacterController.ts` - Player input & movement
- `/src/game/entities/Tag.ts` - HTML tag block implementation
- `/src/game/entities/Wall.ts` - Static platforms and obstacles

### Level Data
- `/src/game/board-data/Board.json` - Background tilemap (6 layers)

## Development Guidelines

### When Adding New Features
1. Determine if it belongs in `engine/` (reusable) or `game/` (game-specific)
2. Follow the existing class hierarchy and event patterns
3. Use `EventEmitter` for cross-component communication
4. Maintain separation between physics, rendering, and logic

### When Adding New Levels
1. Create new scene class extending `Scene`
2. Define background board data in JSON format
3. Spawn walls, platforms, tags, and player in constructor
4. Set target HTML output for win condition
5. Register scene in scene manager

### When Modifying Physics
1. Physics values are in `DynamicBody.ts`
2. Collision detection in `PhysicsSimulation.ts`
3. Test at 200 FPS (physics tick rate)
4. Remember: impulse-based, not velocity-based

### When Working with Assets
1. Assets are Aseprite files in `/src/assets/`
2. Loaded via `AssetsLoader` into `GlobalContext`
3. Access tilemaps, animations, and charmaps from loaded data
4. Sprites use 9-slice scaling for UI elements

### Code Style
1. Use TypeScript strict mode
2. Follow Angular standalone component patterns
3. Prefer composition over inheritance where appropriate
4. Document complex physics or collision logic

## Known TODOs / WIP Areas

1. **Win Condition**: Validation exists but actual win state (e.g., screen transition, celebration) not implemented
2. **Level Editor**: Work in progress in `/src/editor/`
3. **Multiple Levels**: Currently only one hardcoded level exists
4. **Level Progression**: No level selection or progression system yet
5. **Target Image Display**: Need to show the target HTML render to the player

## Testing & Running

```bash
# Install dependencies
yarn install

# Run development server
yarn start

# Build for production
yarn build
```

## Common Tasks

### Adding a New Tag Type
1. Add text to tag creation in `GameLevelScene.ts`
2. Adjust win condition target string
3. Consider visual styling in `Tag.ts`

### Adjusting Movement Feel
1. Modify impulse values in `CharacterController.ts`
2. Adjust gravity/drag in `DynamicBody.ts`
3. Test jump height and horizontal speed

### Creating New Animations
1. Edit Aseprite source files
2. Export to `/src/assets/`
3. Reference in `AssetsLoader` configuration
4. Use `AnimationPlayer` to play animation sequences

## Notes
- The game runs two independent 200 FPS loops (physics and rendering)
- All positions use pixel coordinates
- Collision uses axis-aligned bounding boxes (AABB)
- Sleep system optimizes physics for static objects after 1 second
