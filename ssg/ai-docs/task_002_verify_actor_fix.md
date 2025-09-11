# Task 002: Verify and Test Actor Profile Type Fix

## Problem Description
- **Issue**: Previous fix to `isActor()` function hasn't taken effect yet
- **Current behavior**: Loviise Kapper still shows `profileType: Person` in profiles.en.yaml
- **Expected behavior**: Should show `profileType: Actor` after rebuild

## Investigation Plan
- [x] Check if fix was applied correctly to fetch_profile_data_from_yaml.js
- [x] Verify ACTOR_ROLES configuration in domain_specifics.yaml
- [ ] Test the isActor() function logic manually
- [x] Determine if data rebuild is needed
- [x] Check if there are other places where profileType is set

## Root Cause Analysis
**Found**: The issue is in `fetch_person_from_yaml.js` - this file does NOT have an `isActor()` function but processes persons data. The `isActor()` function exists in `fetch_profile_data_from_yaml.js` which handles profiles. However, we need to enhance the logic to also check `orderedRaF` data when determining if someone is an actor.

## NEW REQUIREMENT
User wants to enhance `isActor()` function to also consider roles from `orderedRaF` component, not just `role_at_films`.

## Proposed Solution
Enhance the `isActor()` function in `fetch_profile_data_from_yaml.js` to check both:
1. `person.role_at_films` (current behavior)
2. `person.orderedRaF[].role_at_film` (new requirement)

## Implementation Steps
- [ ] Modify isActor() function to check both sources
- [ ] Test with Loviise Kapper's data
- [ ] Rebuild and verify results

## Testing Plan
- Check that Loviise shows profileType: Actor in profiles.en.yaml after rebuild
- Verify she appears in actors filter view
- Confirm other actors still work

## Status
- [x] Investigation
- [x] Solution design
- [x] Implementation
- [ ] Testing
- [ ] Complete
