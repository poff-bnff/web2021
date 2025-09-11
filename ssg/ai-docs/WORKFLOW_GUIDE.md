# AI Assistant Workflow Guide

## When tackling issues or implementing features

### 1. Create Task File First
Before making any code changes:
- Create a new task file: `task_XXX_brief_description.md`
- Use sequential numbering (001, 002, etc.)
- Include brief but descriptive name

### 2. Task File Structure
```markdown
# Task XXX: Brief Description

## Problem Description
- What is the issue?
- Who reported it?
- Current behavior vs expected behavior

## Investigation Plan
- [ ] Step 1: What to check first
- [ ] Step 2: What to check next
- [ ] Step 3: etc.

## Root Cause Analysis
(Fill this out during investigation)

## Proposed Solution
(Fill this out after investigation)

## Implementation Steps
- [ ] Step 1
- [ ] Step 2
- [ ] etc.

## Testing Plan
- How to verify the fix works
- What to test

## Status
- [ ] Investigation
- [ ] Solution design
- [ ] Implementation
- [ ] Testing
- [ ] Complete
```

### 3. Workflow Process
1. **Create task file** - Document the problem and plan
2. **Investigate** - Update task file with findings
3. **Plan solution** - Document approach before coding
4. **Get approval** - Discuss plan with user if needed
5. **Implement** - Make code changes
6. **Test** - Verify solution works
7. **Document** - Update PLANNING.md with summary

### 4. No Code Changes Without Task File
- Always create the task file first
- Get user approval for approach when needed
- Keep task file updated throughout process

## For Current Issue (Retrospective)
I should have created `task_001_actor_profile_type_bug.md` first, documented the investigation plan, gotten your approval for the approach, and then implemented the fix.
