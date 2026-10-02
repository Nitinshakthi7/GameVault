# GameVault Multi-Agent System

This document defines a three-agent workflow for efficient task execution in this codebase.

## Agent Roles & Responsibilities

### 1. Code Surveyor (Claude Haiku)
**Purpose:** Read and analyze the entire codebase for specific information needs

**Responsibilities:**
- Traverse all project files and directories
- Search for specific features, bugs, patterns, or implementations
- Provide comprehensive codebase analysis
- Identify file locations and code relationships
- Return structured findings to the Planner

**When to use:**
- User says "find bug", "search for feature", "where is X", "what does this do"
- Any task requiring codebase knowledge
- When looking for patterns or code locations

**Output format:** File paths, code snippets, line numbers, relationships between components

---

### 2. Spec Reader (Claude Haiku)
**Purpose:** Read and interpret all documentation, specifications, and instruction files

**Responsibilities:**
- Read .md, .pdf, .ppt, .docx files
- Extract requirements, prompts, instructions
- Parse technical specifications
- Identify constraints and guidelines
- Return structured spec analysis to the Planner

**When to use:**
- User provides a .md file, document, or specification
- User says "read the doc", "what does this require", "follow these instructions"
- Before implementing any feature defined in documentation

**Output format:** Requirements list, key constraints, implementation guidelines, dependencies

---

### 3. Planner (Claude Opus 5.5)
**Purpose:** Create solid execution plans based on codebase and spec information

**Responsibilities:**
- Receive findings from Code Surveyor and Spec Reader
- Create step-by-step implementation plans
- Identify critical files and dependencies
- Consider architectural trade-offs
- Present plan to user for approval before execution

**When to use:**
- After Code Surveyor and Spec Reader have gathered information
- To break down complex tasks
- To ensure tasks align with codebase patterns and specs

**Output format:** Numbered steps, file paths, dependencies, estimated complexity

---

## Workflow

```
User gives task
    ↓
Does task need codebase reading? → YES → Code Surveyor reads codebase
Does task need spec/doc reading? → YES → Spec Reader reads docs
    ↓
Both agents provide findings to Planner
    ↓
Planner (Opus 5.5) creates detailed execution plan
    ↓
Planner presents plan to user for approval
    ↓
User approves? → YES → Working Agent (Claude) executes
              → NO  → Adjust and re-plan
    ↓
Task complete
```

## Key Rules

1. **Code Surveyor is the ONLY agent** to read the entire codebase
2. **Spec Reader is the ONLY agent** to read .md, .pdf, .ppt, .docx files
3. **Planner always creates the plan** before execution begins
4. **User approval is required** before any code changes or implementations
5. **Working model executes** only after all three steps are complete

## Example Interactions

### Example 1: "Find the bug in the game loop"
1. Code Surveyor → Searches codebase for game loop code
2. Returns → File locations, current implementation
3. Planner → Creates debugging strategy
4. Presents → Step-by-step plan to locate/fix bug
5. User approves → Working model implements fix

### Example 2: "I have these requirements (attach .md)"
1. Spec Reader → Reads .md file
2. Returns → Requirements, constraints, guidelines
3. Code Surveyor → Reads codebase for relevant code areas
4. Planner → Creates implementation plan
5. Presents → Plan aligns specs with codebase
6. User approves → Working model implements

### Example 3: "Add a new feature"
1. Spec Reader → Reads any spec docs (if provided)
2. Code Surveyor → Finds similar features, patterns
3. Planner → Creates feature implementation plan
4. Presents → Steps, files, architecture decisions
5. User approves → Working model builds feature

---

## Agent Selection

When you start a task, I will:
- **Automatically spawn Code Surveyor** if codebase reading is needed
- **Automatically spawn Spec Reader** if documentation reading is needed
- **Automatically spawn Planner** to create execution plans
- **Keep you informed** at each step

Just describe your task, and the right agents will handle it! 🚀
