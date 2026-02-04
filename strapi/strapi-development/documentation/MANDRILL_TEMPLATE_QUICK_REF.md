# Mandrill Template Quick Reference - `cgprofile`

## Template ID Required
**Template Name/Slug**: `cgprofile`

## Merge Variables (Merge Tags)

Use these in your Mandrill template with the syntax: `*|variable_name|*`

| Merge Variable | Description | Example Values |
|----------------|-------------|----------------|
| `*|email|*` | User's email address | `john.doe@example.com` |
| `*|operation|*` | Action performed | `create` or `update` |
| `*|changeDateTime|*` | When the change occurred | `2026-02-04T10:30:00.000Z` |
| `*|allowedToPublish|*` | Can publish profile? | `true` or `false` |
| `*|allowedToPublishValidTo|*` | Publishing permission expires | `2026-12-31T23:59:59.000Z` or `N/A` |
| `*|profileName|*` | Profile display name | `John Doe` or `Company Ltd` |
| `*|profileSlug|*` | URL slug | `john-doe` |
| `*|profileType|*` | Type of profile | `person` or `organisation` |
| `*|profileUrl|*` | Full URL to profile | `https://industry.poff.ee/creative_gate/john-doe` |

## Sample Email Template

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Creative Gate Profile Notification</title>
</head>
<body>
    <h1>Your Creative Gate Profile</h1>
    
    <p>Your *|profileType|* profile "*|profileName|*" has been *|operation|*d.</p>
    
    <p><strong>Details:</strong></p>
    <ul>
        <li>Operation: *|operation|*</li>
        <li>Time: *|changeDateTime|*</li>
        <li>Publishing Allowed: *|allowedToPublish|*</li>
        <li>Publishing Valid Until: *|allowedToPublishValidTo|*</li>
    </ul>
    
    <p><a href="*|profileUrl|*">View Your Profile</a></p>
</body>
</html>
```

## Test Data for Mandrill

Use these values when testing your template in Mandrill dashboard:

```json
{
  "email": "test@example.com",
  "operation": "update",
  "changeDateTime": "2026-02-04T10:30:00.000Z",
  "allowedToPublish": "true",
  "allowedToPublishValidTo": "2026-12-31T23:59:59.000Z",
  "profileName": "John Doe",
  "profileSlug": "john-doe",
  "profileType": "person",
  "profileUrl": "https://industry.poff.ee/creative_gate/john-doe"
}
```

## Sample JSON Payloads

### Create Person Profile
```json
{
  "key": "YZL1VONNdL5a1lBlCjK8IQ",
  "template_name": "cgprofile",
  "template_content": [],
  "message": {
    "to": [{"email": "user@example.com", "type": "to"}],
    "global_merge_vars": [
      {"name": "email", "content": "user@example.com"},
      {"name": "operation", "content": "create"},
      {"name": "changeDateTime", "content": "2026-02-04T10:30:00.000Z"},
      {"name": "allowedToPublish", "content": "true"},
      {"name": "allowedToPublishValidTo", "content": "2026-12-31T23:59:59.000Z"},
      {"name": "profileName", "content": "John Doe"},
      {"name": "profileSlug", "content": "john-doe"},
      {"name": "profileType", "content": "person"},
      {"name": "profileUrl", "content": "https://industry.poff.ee/creative_gate/john-doe"}
    ]
  }
}
```

### Update Organisation Profile
```json
{
  "key": "YZL1VONNdL5a1lBlCjK8IQ",
  "template_name": "cgprofile",
  "template_content": [],
  "message": {
    "to": [{"email": "company@example.com", "type": "to"}],
    "global_merge_vars": [
      {"name": "email", "content": "company@example.com"},
      {"name": "operation", "content": "update"},
      {"name": "changeDateTime", "content": "2026-02-04T15:45:00.000Z"},
      {"name": "allowedToPublish", "content": "false"},
      {"name": "allowedToPublishValidTo", "content": "N/A"},
      {"name": "profileName", "content": "Production Company OÜ"},
      {"name": "profileSlug", "content": "production-company-ou"},
      {"name": "profileType", "content": "organisation"},
      {"name": "profileUrl", "content": "https://industry.poff.ee/creative_gate/production-company-ou"}
    ]
  }
}
```

## Mandrill Setup Steps

1. **Log into Mandrill** (MailChimp Transactional)
2. **Go to Templates** → "Outbound" → "Templates"
3. **Click "Create a Template"**
4. **Set Template Info**:
   - Name: `Creative Gate Profile Notification`
   - Code/Slug: `cgprofile` (MUST BE EXACTLY THIS)
5. **Add HTML Content** with merge variables
6. **Test with sample data** (use values above)
7. **Publish the template**

## Important Notes

- ✅ Template code MUST be exactly `cgprofile` (case-sensitive)
- ✅ Use `*|variable_name|*` syntax for merge variables
- ✅ All 9 merge variables should be used in template
- ✅ Test template before going live
- ✅ Template must be published (not draft)

## Quick Check

After creating template, test by:
1. Creating a new Person profile in Strapi
2. Add Festival Edition 59 (Creative Gate)
3. Link to user with email in user_profile
4. Save profile
5. Check email inbox (and spam folder)

If email not received, check:
- Mandrill template name is exactly `cgprofile`
- Template is published
- Check Mandrill dashboard for errors
- Check Strapi logs for error messages
