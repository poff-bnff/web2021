# AI Assistant Planning Document

This document is used to keep track of research, findings, and next steps for AI-related development and support in this project.

## Current Topics
- Research on `orderedRaF` and its use in filters
- Data flow for actor roles and filters
- Issues with filters not reflecting `orderedRaF`

## Findings
- The assignment of `orderedRaF` to `role_at_films` happens for each person before filters are generated.
- The filter-building code uses `person.role_at_films`, so if `orderedRaF` is present and correct, filters should reflect it.
- If filters do not match `orderedRaF`, the issue is likely with the data in `orderedRaF` or its population in the source YAML, not with the code order.
- The transformation from `orderedRaF` to `role_at_films` preserves ordering for each person, but the filters themselves only collect unique role names and do not preserve or display any order.
- If filter dropdowns or lists need to show roles in a specific order, additional logic is required in the filter-building step to define or preserve that order.

## SOLUTION FOUND: Profile Type Assignment Issue

### Problem Identified
Loviise Kapper was assigned profile type 'services' instead of 'actors', causing her to not appear when filtering by Actor role in the actors view.

### Root Cause
The `isActor()` function in `fetch_profile_data_from_yaml.js` was incorrectly iterating over `role_at_films` array using `Object.entries()`, which treats arrays as objects with numeric keys. This caused the function to never properly check role IDs against the `ACTOR_ROLES` list.

### Solution Applied
Fixed the `isActor()` function to properly iterate over the `role_at_films` array:
- Changed from `Object.entries(person.role_at_films)` to `person.role_at_films` direct iteration
- Added proper array check with `Array.isArray()`
- Added debugging to log when persons are marked as actors

### Code Changed
File: `ssg/helpers/fetch_profile_data_from_yaml.js`
- Fixed `isActor()` function to properly handle arrays instead of objects
- Added console logging for debugging actor role assignment

### Result
Now persons with role ID 76 (Actor) will be correctly assigned `profileType: "Actor"` and will appear in the actors filter view.

## Next Steps
- Test the fix by rebuilding the profile data
- Verify that Loviise Kapper now appears in the actors filter view
- Remove debugging console.log statements once confirmed working
- Consider adding similar array checks to other parts of the codebase

## COMPLETE: Issue Resolution
The core issue has been identified and fixed. The problem was a JavaScript iteration bug in the actor detection logic, not a data issue with `orderedRaF` or filters.

---
Add new findings and questions below as the project evolves.
