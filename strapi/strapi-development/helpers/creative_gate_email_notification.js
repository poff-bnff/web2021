/**
 * Creative Gate Profile Email Notification Helper
 * 
 * Sends email notifications when Creative Gate Person or Organisation profiles are created or updated.
 * Includes a 10-minute throttle to prevent email spam on rapid updates.
 */

const CREATIVE_GATE_EDITION_ID = 59; // Festival Edition ID for Creative Gate
const EMAIL_THROTTLE_MINUTES = 10;

/**
 * Check if the profile is eligible for email notification
 * @param {Object} profile - Person or Organisation profile
 * @returns {Object|null} Returns { user, email, profile } if eligible, null otherwise
 */
async function isEligibleForEmail(profile) {
  // Must have Creative Gate festival edition
  if (!profile.festival_editions?.length) {
    return null;
  }

  const hasCreativeGateEdition = profile.festival_editions.some(
    fe => fe.id === CREATIVE_GATE_EDITION_ID || fe === CREATIVE_GATE_EDITION_ID
  );

  if (!hasCreativeGateEdition) {
    return null;
  }

  // Must have associated user
  if (!profile.user) {
    return null;
  }

  // Must have email in eMail attribute
  if (!profile.eMail) {
    return null;
  }

  return {
    user: profile.user,
    email: profile.eMail,
    profile: profile
  };
}

/**
 * Check if enough time has passed since last update (throttle)
 * @param {Date} previousUpdatedAt - Previous update timestamp (before current save)
 * @returns {boolean} True if enough time has passed, false otherwise
 */
function shouldSendEmail(previousUpdatedAt) {
  if (!previousUpdatedAt) {
    return true; // First creation, always send
  }

  const now = new Date();
  const lastUpdate = new Date(previousUpdatedAt);
  const minutesSinceUpdate = (now - lastUpdate) / (1000 * 60);

  console.log(`Throttle check: ${minutesSinceUpdate.toFixed(2)} minutes since last update (threshold: ${EMAIL_THROTTLE_MINUTES} min)`);

  return minutesSinceUpdate >= EMAIL_THROTTLE_MINUTES;
}

/**
 * Send email notification via Mandrill for Creative Gate profile changes
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.operation - Operation performed on the profile (e.g. "created", "updated")
 * @param {Date} params.changeDateTime - Date and time when the change occurred
 * @param {boolean} params.allowedToPublish - Whether the profile is allowed to be published
 * @param {Date|null} params.allowedToPublishValidTo - Expiry date for publish permission, or null if not applicable
 * @param {string} params.profileName - Name of the profile (person or organisation)
 * @param {string} params.profileSlug - Slug identifier for the profile
 * @param {string} params.profileType - Type of the profile (e.g. "person", "organisation")
 * @returns {Promise} Resolves with result or null on error
 */
async function sendCreativeGateProfileEmail({
  email,
  operation,
  changeDateTime,
  allowedToPublish,
  allowedToPublishValidTo,
  profileName,
  profileSlug,
  profileType
}) {
  try {
    const templateVars = [
      { name: 'email', content: email },
      { name: 'operation', content: operation },
      { name: 'changeDateTime', content: changeDateTime.toISOString() },
      { name: 'allowedToPublish', content: allowedToPublish ? 'true' : 'false' },
      { 
        name: 'allowedToPublishValidTo', 
        content: allowedToPublishValidTo ? allowedToPublishValidTo.toISOString() : 'N/A' 
      },
      { name: 'profileName', content: profileName },
      { name: 'profileSlug', content: profileSlug },
      { name: 'profileType', content: profileType },
      { 
        name: 'profileUrl', 
        content: `https://industry.poff.ee/creative_gate/${profileSlug}` 
      }
    ];
    const result = await strapi.plugins['email'].services.email.send({
      to: email,
      template_name: 'cgprofile',
      template_vars: templateVars
    });

    if (!result) {
      console.warn(`Creative Gate profile ${operation} email failed to send to: ${email}`);
      return null;
    }
    console.log(`Creative Gate profile ${operation} email sent to: ${email}`);
    return result;
  } catch (error) {
    console.error('Creative Gate email error:', error);
    return null;
  }
}

/**
 * Handle profile notification (main entry point)
 * Checks eligibility, throttling, and sends email if appropriate
 * @param {Object} profile - Person or Organisation profile (current state after update)
 * @param {string} operation - 'create' or 'update'
 * @param {string} profileType - 'person' or 'organisation'
 * @param {Date} previousUpdatedAt - Previous updated_at timestamp (before this update)
 */
async function handleCreativeGateProfileNotification(profile, operation, profileType, previousUpdatedAt = null) {
  try {
    // Check eligibility
    const eligibility = await isEligibleForEmail(profile);
    if (!eligibility) {
      console.log(`Profile ${profile.id} not eligible for Creative Gate email notification`);
      return;
    }

    // Check throttle for updates
    if (operation === 'update' && !shouldSendEmail(previousUpdatedAt)) {
      console.log(
        `Skipping email for profile ${profile.id} - last update was less than ${EMAIL_THROTTLE_MINUTES} minutes ago`
      );
      return;
    }

    // Get profile info
    const profileName = profile.firstNameLastName || profile.name_et || profile.name_en || 'Profile';
    const profileSlug = profile.slug_et || profile.slug_en || profile.id;
    const allowedToPublish = profile.allowed_to_publish || false;
    const allowedToPublishValidTo = profile.allowed_to_publish_valid_to_date || null;

    // Send email (fire-and-forget, errors handled internally)
    sendCreativeGateProfileEmail({
      email: eligibility.email,
      operation,
      changeDateTime: new Date(),
      allowedToPublish,
      allowedToPublishValidTo,
      profileName,
      profileSlug,
      profileType
    });

  } catch (error) {
    console.error('Error in handleCreativeGateProfileNotification:', error);
  }
}

module.exports = {
  handleCreativeGateProfileNotification,
  sendCreativeGateProfileEmail,
  isEligibleForEmail,
  shouldSendEmail,
  CREATIVE_GATE_EDITION_ID,
  EMAIL_THROTTLE_MINUTES
};
