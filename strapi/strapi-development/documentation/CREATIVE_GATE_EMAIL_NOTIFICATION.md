# Creative Gate Profile Email Notifications

## Overview

This feature automatically sends email notifications to users when they create or update their Creative Gate Person or Organisation profiles on the Industry@POFF website.

## How It Works

### Eligibility Criteria

An email notification is sent when ALL of the following conditions are met:

1. **Profile has Creative Gate Festival Edition**: The profile must be associated with Festival Edition ID `59` (Creative Gate)
2. **User is associated**: The profile must have a linked user account
3. **User has email**: The user's profile must have a contact email address filled in
4. **Not throttled**: For updates, at least 10 minutes must have passed since the last update

### Throttling Mechanism

To prevent email spam when users make multiple quick edits:
- Email is ALWAYS sent on profile creation
- Email is sent on update ONLY IF more than 10 minutes have passed since the last update
- If less than 10 minutes have passed, the email is skipped

## Implementation Details

### Files Modified

1. **Helper Module** (NEW): `/strapi/strapi-development/helpers/creative_gate_email_notification.js`
   - Contains all email notification logic
   - Handles eligibility checks, throttling, and email sending

2. **Person Model**: `/strapi/strapi-development/api/person/models/person.js`
   - Added email notification in `afterCreate` lifecycle hook
   - Added email notification in `afterUpdate` lifecycle hook

3. **Organisation Model**: `/strapi/strapi-development/api/organisation/models/organisation.js`
   - Added email notification in `afterCreate` lifecycle hook
   - Added email notification in `afterUpdate` lifecycle hook

### Email Template Configuration

The system sends emails using the **Mandrill template ID: `cgprofile`**

You need to create this template in Mandrill with the following merge variables:

#### Mandrill Template Variables (Merge Tags)

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `email` | string | Recipient's email address | `user@example.com` |
| `operation` | string | Type of operation performed | `create` or `update` |
| `changeDateTime` | string (ISO 8601) | When the change occurred | `2026-02-04T10:30:00.000Z` |
| `allowedToPublish` | string | Publishing permission status | `true` or `false` |
| `allowedToPublishValidTo` | string (ISO 8601) or N/A | Publishing permission end date | `2026-12-31T23:59:59.000Z` or `N/A` |
| `profileName` | string | Name of the profile | `John Doe` or `Production Company Ltd` |
| `profileSlug` | string | URL slug of the profile | `john-doe` |
| `profileType` | string | Type of profile | `person` or `organisation` |
| `profileUrl` | string | Full URL to the profile | `https://industry.poff.ee/creative_gate/john-doe` |

#### Example Mandrill Template Structure

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Creative Gate Profile *|operation|* Notification</title>
</head>
<body>
    <h1>Your Creative Gate Profile has been *|operation|*d</h1>
    
    <p>Hello,</p>
    
    <p>Your Creative Gate *|profileType|* profile "<strong>*|profileName|*</strong>" has been successfully *|operation|*d.</p>
    
    <h2>Profile Details:</h2>
    <ul>
        <li><strong>Profile Type:</strong> *|profileType|*</li>
        <li><strong>Profile Name:</strong> *|profileName|*</li>
        <li><strong>Operation:</strong> *|operation|*</li>
        <li><strong>Change Time:</strong> *|changeDateTime|*</li>
        <li><strong>Publishing Permission:</strong> *|allowedToPublish|*</li>
        <li><strong>Publishing Valid Until:</strong> *|allowedToPublishValidTo|*</li>
    </ul>
    
    <p><a href="*|profileUrl|*">View Your Profile</a></p>
    
    <hr>
    <p><small>This is an automated email from Industry@POFF Creative Gate.</small></p>
</body>
</html>
```

## Mandrill Template Setup Instructions

1. **Log in to Mandrill** (MailChimp Transactional Email)

2. **Create New Template**:
   - Go to "Outbound" → "Templates"
   - Click "Create a Template"
   - Template Name: `cgprofile`
   - Template Code/Slug: `cgprofile`

3. **Add Template Content**:
   - Use the HTML structure provided above
   - Customize the design to match your brand
   - Use merge tags like `*|variable_name|*` for dynamic content

4. **Test the Template**:
   - Use Mandrill's test feature
   - Provide sample values for all merge tags
   - Verify email rendering

5. **Publish the Template**

## Testing

### Test Scenarios

1. **Create New Person Profile with Creative Gate Edition**:
   - Expected: Email sent immediately
   - Check: User receives email with `operation: create`

2. **Update Person Profile Immediately**:
   - Expected: NO email sent (throttled)
   - Check: No email received

3. **Update Person Profile After 10+ Minutes**:
   - Expected: Email sent
   - Check: User receives email with `operation: update`

4. **Create Organisation Profile**:
   - Expected: Email sent immediately
   - Check: User receives email with `profileType: organisation`

5. **Profile Without Creative Gate Edition**:
   - Expected: NO email sent
   - Check: No email received

6. **Profile Without User Email**:
   - Expected: NO email sent
   - Check: No email received

### Server Logs

Monitor Strapi console logs for email notifications:

```
Sending Creative Gate profile create email to: user@example.com
Creative Gate profile email sent successfully to: user@example.com
```

Or for skipped emails:

```
Profile 123 not eligible for Creative Gate email notification
```

```
Skipping email for profile 456 - last update was less than 10 minutes ago
```

## Configuration

### Environment Variables

Email is configured using existing Mandrill settings in `.env`:

```env
MandrillApiKey='YZL1VONNdL5a1lBlCjK8IQ'
MandrillDefaultReplyToEmail='info@poff.ee'
MandrillDefaultFromEmail='info@poff.ee'
MandrillDefaultFromName='PFF Konto'
```

### Constants (in helper file)

```javascript
const CREATIVE_GATE_EDITION_ID = 59; // Festival Edition ID for Creative Gate
const EMAIL_THROTTLE_MINUTES = 10;   // Minimum minutes between update emails
```

## JSON Payload Examples

### Example 1: Create Person Profile

```json
{
  "to": "john.doe@example.com",
  "template_name": "cgprofile",
  "template_vars": [
    { "name": "email", "content": "john.doe@example.com" },
    { "name": "operation", "content": "create" },
    { "name": "changeDateTime", "content": "2026-02-04T10:30:00.000Z" },
    { "name": "allowedToPublish", "content": "true" },
    { "name": "allowedToPublishValidTo", "content": "2026-12-31T23:59:59.000Z" },
    { "name": "profileName", "content": "John Doe" },
    { "name": "profileSlug", "content": "john-doe" },
    { "name": "profileType", "content": "person" },
    { "name": "profileUrl", "content": "https://industry.poff.ee/creative_gate/john-doe" }
  ]
}
```

### Example 2: Update Organisation Profile

```json
{
  "to": "company@example.com",
  "template_name": "cgprofile",
  "template_vars": [
    { "name": "email", "content": "company@example.com" },
    { "name": "operation", "content": "update" },
    { "name": "changeDateTime", "content": "2026-02-04T15:45:30.000Z" },
    { "name": "allowedToPublish", "content": "false" },
    { "name": "allowedToPublishValidTo", "content": "N/A" },
    { "name": "profileName", "content": "Production Company OÜ" },
    { "name": "profileSlug", "content": "production-company-ou" },
    { "name": "profileType", "content": "organisation" },
    { "name": "profileUrl", "content": "https://industry.poff.ee/creative_gate/production-company-ou" }
  ]
}
```

## Troubleshooting

### Email Not Sent

**Check the following**:

1. Is Festival Edition 59 (Creative Gate) associated with the profile?
2. Does the profile have a linked user?
3. Does the user have a user_profile with email filled?
4. For updates: Has 10 minutes passed since last update?
5. Check Strapi server logs for error messages
6. Verify Mandrill API key is correct in `.env`
7. Check Mandrill dashboard for API errors

### Email Sent But Not Received

1. Check spam/junk folder
2. Verify email address is correct
3. Check Mandrill dashboard for delivery status
4. Verify Mandrill template `cgprofile` exists and is published

### Multiple Emails Received

- This should not happen due to 10-minute throttle
- Check if multiple users are updating the same profile
- Verify throttle logic in helper file

## Support

For issues or questions:
1. Check Strapi server logs: `/strapi/strapi-development/`
2. Check Mandrill dashboard for email delivery status
3. Review this documentation
4. Contact development team

## Future Enhancements

Potential improvements:
- Make throttle time configurable via environment variable
- Add email preferences for users (opt-in/opt-out)
- Include more profile details in email
- Send separate emails for different types of changes
- Add email preview in Strapi admin panel
