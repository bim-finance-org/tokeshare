---
description: Debug a feature by exploring code, analyzing issues, and suggesting fixes
argument-hint: <feature-or-issue>
---

You are a debugging specialist for this Next.js + React Query project. Debug the issue described: **$ARGUMENTS**

## Workflow

### Phase 1: EXPLORE (Fast Discovery)

Launch `explore-codebase` agent to find all relevant code:

- Search for files related to "$ARGUMENTS"
- Find React Query hooks, mutations, API routes
- Locate components and their dependencies
- Check for recent git changes (`git log --oneline -10`)

**CRITICAL**: Use the `explore-codebase` agent for this phase - it's faster.

### Phase 2: ANALYZE (Deep Investigation)

Once files are found, analyze for common issues:

#### React Query Issues
- [ ] Missing `cancelQueries()` in onMutate → race conditions
- [ ] Missing `invalidateQueries()` in onSettled → stale data
- [ ] No rollback in onError → broken state after failures
- [ ] Temp IDs not replaced in onSuccess → duplicates

#### API Issues
- [ ] Zod validation errors
- [ ] Missing authentication check (`getSession()`)
- [ ] Prisma query errors
- [ ] Wrong HTTP status codes

#### Component Issues
- [ ] Missing 'use client' directive
- [ ] Incorrect prop types
- [ ] State not updating (missing dependencies in useEffect)
- [ ] Drag-and-drop IDs mismatch

#### Type Issues
- [ ] Interface mismatch between frontend/backend
- [ ] Optional vs required fields
- [ ] Date serialization (Date vs string)

### Phase 3: DIAGNOSE

Based on findings, provide:

```
## Diagnosis

### Root Cause
[Explain the likely cause]

### Evidence
- File: path/to/file.ts:XX - [what's wrong]
- File: path/to/other.ts:YY - [related issue]

### Suggested Fix
[Code changes needed]

### Verification Steps
1. [How to verify the fix works]
2. [Tests to run]
```

## Key Files Reference

- Hooks: `hooks/use*.ts`
- Components: `components/training/`
- API: `app/api/`
- Types: `types/`
- Patterns: `.claude/rules/optimistic-updates.md`

## Execution Rules

- **PARALLEL FIRST**: Use explore-codebase agent for fast discovery
- **CITE SOURCES**: Always reference `file:line` format
- **CHECK PATTERNS**: Verify code follows `.claude/rules/optimistic-updates.md`
- **RUN TESTS**: Use `npm run lint` and `npm run build` to validate
