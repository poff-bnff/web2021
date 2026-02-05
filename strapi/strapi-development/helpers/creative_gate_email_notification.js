/**
 * Creative Gate Profile Email Notification Helper
 * 
 * Sends email notifications when Creative Gate Person or Organisation profiles are created or updated.
 * Includes a 10-minute throttle to prevent email spam on rapid updates.
 */

const CREATIVE_GATE_EDITION_ID = 59; // Festival Edition ID for Creative Gate
const EMAIL_THROTTLE_MINUTES = 10;

/**
 * Check if the profile has Creative Gate festival edition and associated user with email
 * @param {Object} profile - Person or Organisation profile
 * @returns {Object|null} Returns { user, email, profile } if eligible, null otherwise
 */
async function isEligibleForEmail(profile) {
  // Check if profile has Creative Gate festival edition
  if (!profile.festival_editions || !profile.festival_editions.length) {
    return null;
  }

  const hasCreativeGateEdition = profile.festival_editions.some(
    fe => fe.id === CREATIVE_GATE_EDITION_ID || fe === CREATIVE_GATE_EDITION_ID
  );

  if (!hasCreativeGateEdition) {
    return null;
  }

  // Check if profile has associated user
  if (!profile.user) {
    return null;
  }

  // Get full user info with user_profile
  const userInfo = await strapi.query('user', 'users-permissions').findOne(
    { id: profile.user.id || profile.user },
    ['user_profile']
  );

  if (!userInfo || !userInfo.user_profile || !userInfo.user_profile.email) {
    return null;
  }

  return {
    user: userInfo,
    email: userInfo.user_profile.email,
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
 * @param {string} params.email - Recipient email
 * @param {string} params.operation - 'create' or 'update'
 * @param {Date} params.changeDateTime - When the change occurred
 * @param {boolean} params.allowedToPublish - Publishing permission status
 * @param {Date|null} params.allowedToPublishValidTo - Publishing permission end date
 * @param {string} params.profileName - Profile name
 * @param {string} params.profileSlug - Profile slug/URL
 * @param {string} params.profileType - 'person' or 'organisation'
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
    console.log(`Sending Creative Gate profile ${operation} email to: ${email}`);

    // Prepare template variables for Mandrill
    const templateVars = [
      { name: 'email', content: email },
      { name: 'operation', content: operation }, // 'create' or 'update'
      { name: 'changeDateTime', content: changeDateTime.toISOString() },
      { name: 'allowedToPublish', content: allowedToPublish ? 'true' : 'false' },
      { 
        name: 'allowedToPublishValidTo', 
        content: allowedToPublishValidTo ? allowedToPublishValidTo.toISOString() : 'N/A' 
      },
      { name: 'profileName', content: profileName },
      { name: 'profileSlug', content: profileSlug },
      { name: 'profileType', content: profileType }, // 'person' or 'organisation'
      { 
        name: 'profileUrl', 
        content: `https://industry.poff.ee/creative_gate/${profileSlug}` 
      }
    ];

    // Send email using Strapi email plugin (Mandrill)
    const result = await strapi.plugins['email'].services.email.send({
      to: email,
      template_name: 'cgprofile', // Mandrill template ID
      template_vars: templateVars
    });

    console.log(`Creative Gate profile email sent successfully to: ${email}`);
    return result;

  } catch (error) {
    console.error('Error sending Creative Gate profile email:', error);
    throw error;
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
    // Check if profile is eligible for email notification
    const eligibility = await isEligibleForEmail(profile);
    if (!eligibility) {
      console.log(`Profile ${profile.id} not eligible for Creative Gate email notification`);
      return;
    }

    // For updates, check throttle (don't send if updated less than threshold ago)
    if (operation === 'update' && !shouldSendEmail(previousUpdatedAt)) {
      console.log(
        `Skipping email for profile ${profile.id} - last update was less than ${EMAIL_THROTTLE_MINUTES} minutes ago`
      );
      return;
    }

    // Get profile name and slug
    const profileName = profile.firstNameLastName || profile.name_et || profile.name_en || 'Profile';
    const profileSlug = profile.slug_et || profile.slug_en || profile.id;

    // Get publishing properties
    const allowedToPublish = profile.allowed_to_publish || false;
    const allowedToPublishValidTo = profile.allowed_to_publish_valid_to_date || null;

    // Send email
    await sendCreativeGateProfileEmail({
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
    // Don't throw - we don't want email failures to break the profile save
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
