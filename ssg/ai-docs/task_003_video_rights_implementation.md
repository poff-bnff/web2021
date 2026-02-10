# Task 003: Video Rights Implementation - Badge to Rights Migration

## Overview
Migrate from badge-based video access control to rights-based system using user roles and permissions.

---

## ✅ Completed: SSG Updates

### Files Updated:
1. **loginHeader.js** - Added helper functions for different content types
2. **industry_event_index_template.pug** - Updated to use rights-based API
3. **discamp_courseevent_index_template.pug** - Updated to use rights-based API  
4. **industryproject_industry_index_template.pug** - Updated to use rights-based API
5. **courseevent_index_template.pug** - Already using rights-based API (no changes needed)

### New Helper Functions Added:
- `getCourseEventVideoUrl(courseEventId)` - Updated to pass contentType
- `getIndustryEventVideoUrl(industryEventId)` - NEW
- `getDiscampEventVideoUrl(discampEventId)` - NEW
- `getIndustryProjectVideoUrl(industryProjectId)` - NEW

All functions now call: `${huntAuthDomain}/api/validate/eventUrl?contentType={type}&contentId={id}`

---

## 🔄 Required: Hunt API Update

### Updated Prompt for Hunt Repository:

```
I need to update the `/api/validate/eventUrl` endpoint to use a new rights-based permission system instead of the old badge-based system.

## Current Implementation (OLD - needs to be replaced):
The endpoint currently checks if a user has Fiona accreditation via:
```javascript
if (user.industry_profile && user.industry_profile.accreditation) {
    // return video URL
}
```

## Required New Implementation:
Check if user has the `show_courseevent_video` permission through their assigned roles.

## Request Parameters:
- `contentType` (query param): 'course-event' | 'industry-event' | 'dis-camp-event' | 'industry-project'
- `contentId` (query param): ID of the content item
- Authorization header: Bearer JWT token

## Data Structure in Strapi:
```
User
 └─ user_roles[] (array of UserRole objects)
     ├─ id
     ├─ name
     ├─ valid_from (datetime)
     ├─ valid_to (datetime)
     └─ user_right[] (array of UserRight components)
         ├─ name
         ├─ functions[] (array of Function objects)
         │   ├─ id
         │   ├─ name
         │   └─ function_parameters[] (array of components)
         │       ├─ property (string)
         │       └─ value (string)
         ├─ smart_folders[] (not used for this feature)
         └─ dumb_folders[] (not used for this feature)
```

## Permission Check Logic:
1. **Authentication**: Extract userId from JWT token in Authorization header
2. **Fetch User**: Get user from Strapi with populated relations:
   - `user_roles`
   - `user_roles.user_right`
   - `user_roles.user_right.functions`
   - `user_roles.user_right.functions.function_parameters`
3. **Filter Valid Roles**: Where `valid_from <= currentDate <= valid_to`
4. **Check Permission**: In any valid role, check if:
   - `user_right` → `functions` → `function_parameters` where
   - `property === 'show_courseevent_video'` AND
   - `value === 'true'`

## Content Fetching:
Based on `contentType`, fetch from appropriate Strapi collection:
- `course-event` → `/api/course-events/{contentId}`
- `industry-event` → `/api/industry-events/{contentId}`
- `dis-camp-event` → `/api/dis-camp-events/{contentId}`
- `industry-project` → `/api/industry-projects/{contentId}`

## Video URL Field Names (per content type):
- `course-event`: `video_url`
- `industry-event`: `videoUrl`
- `dis-camp-event`: `video_url`
- `industry-project`: `clipUrl`

## Video URL Parsing:
Parse from various formats:
- VideoLevels: `https://videolevels.com/bc/VIDEO_ID/...` → Extract after `/bc/` before next `/`
- Vimeo: Extract video ID
- YouTube: Extract video ID

## Response Format:
```javascript
// Success
{
  videoProvider: 'videolevels.com' | 'vimeo' | 'youtube',
  videoId: 'extracted-id'
}

// Failure
{
  error: 'No permission to view video',
  code: 403
}
```

## Error Handling:
- If user not authenticated: 401
- If user has no permission: 403
- If content not found: 404
- If no video on content: Return `{error: 'No video available', code: 404}`

## Logging:
Log permission checks for debugging:
```javascript
console.log(`Video access for user ${userId}, ${contentType} ${contentId}: ${hasPermission ? 'GRANTED' : 'DENIED'}`)
```

## Notes:
- Similar pattern to `/api/rolecheck` endpoint in this repository
- Frontend expects exact response format above
- Handle cases where user_roles might be empty
```

---

## 🔧 Required: Strapi Configuration

### Step 1: Create Function with Parameters

1. Navigate to: **Content-Types** → **Function**
2. Create new function: **"Show Course Event Video"**
3. Add **function_parameter**:
   - property: `show_courseevent_video`
   - value: `true`

### Step 2: Create/Update User Rights

For each content type that needs video access control, create user rights:

#### Example: Industry PRO Role
1. Navigate to: **User Role** collection
2. Find or create role: "Industry PRO"
3. Set dates: `valid_from` and `valid_to`
4. Add **user_right** component:
   - name: "View Course Event Videos"
   - Select **functions**: Choose "Show Course Event Video" function
5. Save

### Step 3: Verify Role Assignment

The existing `eventivalBadgeRoleAdder` service assigns roles based on Fiona badges:
- Located in: `strapi/extensions/users-permissions/services/eventivalBadgeRoleAdder.js`
- Already assigns roles when users log in via Fiona
- **Ensure these roles have the video viewing right attached**

### Step 4: Badge to Role Mapping

Current badge types from Fiona (defined in `domain_specifics.yaml`):
- MANAGEMENT
- JURY
- Industry PRO
- Industry ACCESS
- PRESS
- GUEST
- TEAM
- VOLUNTEER

**Action Required**: In Strapi admin, ensure UserRoles corresponding to these badges have the appropriate user_rights with the `show_courseevent_video` function.

---

## 🎯 Testing Checklist

### SSG Side (Completed):
- [x] Updated templates to call Hunt API
- [x] Added helper functions for all content types
- [x] Error handling in place
- [x] Logging for debugging

### Hunt API Side (To Do):
- [ ] Update `/api/validate/eventUrl` endpoint
- [ ] Handle multiple content types
- [ ] Implement rights-based permission check
- [ ] Parse video URLs correctly
- [ ] Return proper error codes
- [ ] Add logging

### Strapi Side (To Do):
- [ ] Create "Show Course Event Video" function
- [ ] Add function parameter (`show_courseevent_video` = `true`)
- [ ] Update all relevant UserRoles to include video viewing right
- [ ] Verify eventivalBadgeRoleAdder assigns correct roles
- [ ] Test role assignment on Fiona login

### Integration Testing (To Do):
- [ ] User with Industry PRO badge can see videos
- [ ] User without proper role/right cannot see videos
- [ ] Videos show for course-event
- [ ] Videos show for industry-event
- [ ] Videos show for dis-camp-event
- [ ] Videos show for industry-project
- [ ] Expired roles (past valid_to) deny access
- [ ] Future roles (before valid_from) deny access

---

## 📊 Architecture Diagram

```
┌─────────────────┐
│   SSG Frontend  │
│  (Pug Template) │
└────────┬────────┘
         │ getCourseEventVideoUrl(id)
         ↓
┌─────────────────┐
│  loginHeader.js │
│   (JS Helper)   │
└────────┬────────┘
         │ GET /api/validate/eventUrl?contentType=X&contentId=Y
         ↓
┌─────────────────┐
│  Hunt OAuth     │
│   Service       │
└────────┬────────┘
         │ Query Strapi
         ↓
┌─────────────────────────────────────────┐
│             Strapi CMS                  │
│                                         │
│  User → user_roles → user_right →      │
│  functions → function_parameters        │
│                                         │
│  Check: show_courseevent_video = true   │
│  Check: valid_from <= now <= valid_to   │
└─────────────────────────────────────────┘
```

---

## 🔄 Migration Path Summary

### Old System:
```javascript
if (user.industry_profile.accreditation) {
    showVideo()
}
```

### New System:
```javascript
const hasRight = user.user_roles
    .filter(role => isValid(role.valid_from, role.valid_to))
    .some(role => 
        role.user_right?.some(right =>
            right.functions?.some(func =>
                func.function_parameters?.some(param =>
                    param.property === 'show_courseevent_video' && 
                    param.value === 'true'
                )
            )
        )
    )

if (hasRight) {
    showVideo()
}
```

---

## 📝 Notes

- The SSG changes are backward compatible - if Hunt API is not updated, videos simply won't show
- Strapi changes are additive - existing data is not modified
- The `eventivalBadgeRoleAdder` service continues to work, just need to ensure roles have proper rights
- All video access is now auditable through role assignments
- Time-bounded access is now possible via `valid_from` and `valid_to` dates

---

## 🔗 Related Files

### SSG:
- `/ssg/source/_scripts/loginHeader.js`
- `/ssg/source/_templates/courseevent_index_template.pug`
- `/ssg/source/_templates/industry_event_index_template.pug`
- `/ssg/source/_templates/discamp_courseevent_index_template.pug`
- `/ssg/source/_templates/industryproject_industry_index_template.pug`

### Strapi:
- `/strapi/extensions/users-permissions/services/eventivalBadgeRoleAdder.js`
- `/strapi/extensions/users-permissions/services/Providers.js`
- `/strapi/extensions/users-permissions/services/getEventivalBadges.js`
- `/strapi/extensions/users-permissions/controllers/user/api.js` (roleController method)

### Configuration:
- `/ssg/domain_specifics.yaml` (industry_eventival_badges_whitelist)
