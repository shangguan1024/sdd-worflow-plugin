# SDD-Workflow TypeScript Plugin

7-phase development lifecycle plugin for opencode with mandatory phase gates.

## Installation

### As opencode Plugin

Add to your `opencode.json`:

```json
{
  "plugin": [
    "./opencode-sdd-workflow/dist/index.js"
  ]
}
```

Or install globally:

```bash
npm install opencode-sdd-workflow
```

Then add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "opencode-sdd-workflow"
  ]
}
```

### As CLI Tool

```bash
npm install -g opencode-sdd-workflow
sdd init
sdd start user-auth
sdd status
```

## Features

- **Phase Gate Middleware**: Blocks operations that violate phase transitions
- **Loop Detection**: Prevents infinite edit loops
- **Artifact Check**: Validates required artifacts per phase
- **Context Monitor**: Tracks edit counts and hot files
- **State Management**: Persistent state in `.sdd/state.json`
- **Progressive Disclosure**: 3-layer memory loading
- **Privacy Filter**: Removes sensitive data from context

## CLI Commands

```bash
sdd init              # Initialize project
sdd start <feature>   # Start feature development
sdd resume <feature>  # Resume interrupted workflow
sdd status            # Show current status
sdd complete          # Complete workflow
sdd gate <phase> <action>  # Phase gate operations
sdd refresh           # Force context refresh
```

## Plugin Tools (in opencode dialog)

- `sdd_init`: Initialize project
- `sdd_start`: Start feature
- `sdd_resume`: Resume workflow
- `sdd_status`: Show status
- `sdd_complete`: Complete workflow
- `sdd_gate`: Phase gate check/approve
- `sdd_refresh`: Context refresh
- `sdd_memory_timeline`: Memory timeline (Layer 2)
- `sdd_memory_details`: Memory details (Layer 3)

## Development

```bash
npm run build    # Compile TypeScript
npm run dev      # Watch mode
```

## License

MIT