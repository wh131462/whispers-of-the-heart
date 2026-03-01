# Claude Code – Core Rules

You are working in a real production codebase.

---

## Global Language & Output Rules

- Always respond with Model:[current-model]
- Always respond in Simplified Chinese
- Be concise, technical, and precise
- No fluff, no praise, no motivational language
- Explain only what is necessary

---

## Core Behavior

- Prefer correctness over cleverness
- Prefer minimal, safe changes
- Never assume missing requirements
- If information is missing or uncertain, say so explicitly

---

## Code Rules

- Do NOT change business logic unless explicitly asked
- Do NOT introduce new dependencies unless explicitly asked
- Do NOT refactor unrelated code
- Keep changes local, minimal, and reviewable
- Always follow the project’s ESLint specifications

---

## File & Artifact Creation Rules

- Never create example files unless explicitly requested
- Never create test files unless explicitly requested
- Never create fix summaries, implementation summaries, or similar documentation files unless explicitly specified

---

## Terminal & Runtime Rules

- When using terminal tools, avoid restarting the project unless absolutely necessary
- Assume the project is designed to run continuously

---

## Reasoning Rules

- Give conclusions first, then reasoning
- Clearly separate confirmed facts from assumptions
- Never guess framework, library, or environment behavior
- If behavior is uncertain, suggest how to verify instead of guessing

---

## HTML & Markup Rules

- When writing special characters inside HTML tags, always use their corresponding HTML entity form

---

Follow these rules strictly unless explicitly overridden by the user.

---

## AI Collaboration Documents (.ai/)

The `.ai/` directory at the project root contains a structured knowledge base designed for cross-session AI collaboration. You MUST read and maintain these documents as specified below.

### Document Index

| Document                   | Purpose                                         | When to Read                            | When to Update                                         |
| -------------------------- | ----------------------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| `.ai/1-PROJECT-CONTEXT.md` | Project structure, modules, ports, commands     | When you need global project context    | When project structure changes significantly           |
| `.ai/2-TECH-STACK.md`      | Tech stack versions, dependencies, env vars     | When you need technical details         | When dependencies are added/upgraded/removed           |
| `.ai/3-CODING-RULES.md`    | Naming conventions, code templates, constraints | Before writing any code                 | When new coding standards are identified               |
| `.ai/4-PATTERNS.md`        | Reusable code patterns and templates            | When implementing new features          | When a pattern is used 3+ times across the codebase    |
| `.ai/5-MEMORY.md`          | Session memory: decisions, issues, solutions    | At session start for historical context | **MUST update at the end of every meaningful session** |

### Dynamic Update Rules

#### 5-MEMORY.md (MANDATORY — update every session)

- After completing **meaningful work** (not simple Q&A), you MUST update this file before the session ends
- Content to record:
  - Session log: date, topic, modified files, implementation details
  - Key decisions and their rationale
  - Problems discovered and solutions applied
  - Unfinished tasks or follow-ups
- Retain the 5 most recent session logs; older logs may be condensed
- Keep the "Current Context" section updated with the 3 most recent session summaries
- Add new reusable solutions to the "Common Issues & Solutions" table
- Add new critical file paths to the "Key Code Locations" index table

#### 1-PROJECT-CONTEXT.md (update as needed)

Trigger conditions:

- New feature module added (e.g., new app, new API module)
- Project structure changed (new directories, new shared packages)
- Port or command changes

#### 2-TECH-STACK.md (update as needed)

Trigger conditions:

- New dependency added
- Major dependency version upgraded
- New database model created
- Environment variable changes

#### 3-CODING-RULES.md (update as needed)

Trigger conditions:

- New coding convention identified that needs enforcement
- ESLint / Prettier rule changes
- New API response format or error handling pattern

#### 4-PATTERNS.md (update as needed)

Trigger conditions:

- Same code pattern implemented 3+ times — extract as a reusable pattern
- Critical integration pattern discovered (e.g., BlockNote customization, event mechanisms)
- Existing pattern undergoes significant changes

### Update Principles

- ✅ Record only key information; avoid redundancy
- ✅ Use tables and lists for fast indexing
- ✅ Keep each document under 1500 words
- ❌ Do NOT record routine CRUD operations or trivial style changes
- ❌ Do NOT record temporary debug information
- ❌ Do NOT duplicate existing content

---

## Important Constraints (Network Access Rules)

1. In this task:
   - Your built-in `fetch / WebFetch / any internal network request capability` must be treated as **completely unavailable**.
   - You are **not allowed to initiate any direct HTTP requests**.
2. Any action that requires internet access (including web browsing, API calls, or data queries):
   → **must be performed exclusively through the MCP tool `chrome_devtools`.**
3. Replacement rule:
   - Any scenario that would normally require `fetch / WebFetch`
     → must be replaced with calls to **mcp chrome_devtools**.
4. Information source rule:
   All network-related judgments (API availability, request parameters, headers, response structure, etc.)
   → must rely solely on **real records from Chrome DevTools Network Panel** as the only source of truth.
5. Strictly prohibited:
   - Simulating or fabricating API requests
   - Constructing requests based on assumptions
   - Guessing API structures from prior knowledge
   - Using “trial-and-error” requests to test interfaces
6. Data acquisition process:
   When network information is required, you may only:
   - Wait for me to provide copied Request / Response from DevTools
   - Or call `mcp chrome_devtools` to analyze real network activity
   - **You must not invent or assume any network data**
