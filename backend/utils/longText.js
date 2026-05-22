/**
 * @module utils/longText
 * @description Inline-styled HTML email templates. Kept in one file so
 * the visual palette stays consistent across activation, reset, and
 * moderation emails. Each builder is a one-liner so the raw HTML stays
 * source-grep-friendly. Callers pair these with the plaintext fallback
 * argument of {@link module:utils/sendEmail}.
 */

/**
 * Welcome / account activation email body.
 * @param {string} activationUrl
 * @returns {string} Inline-styled HTML.
 */
export const getActivationEmailHTML = (activationUrl) => {
    return `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;"><div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px;"><h2 style="text-align: center; color: #333;">Welcome to Our Live Media Sharing 🎉</h2><p style="font-size: 16px; color: #444;">You're almost there! Click the button below to activate your account.</p><div style="text-align: center; margin: 30px 0;"><a href="${activationUrl}"style="background: #4CAF50; color: white; padding: 12px 20px;text-decoration: none; border-radius: 5px; font-weight: bold;">Activate Account</a></div><p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p><p style="word-break: break-all; color: #007BFF;">${activationUrl}</p><hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" /><p style="font-size: 12px; color: #888; text-align: center;"> This link is valid for 10 minutes.</br>You can only request for activation three times a day.</br>If you did not create this account, you can safely ignore this email.</p></div></div>`;
};

/**
 * Re-sent activation link email body.
 * @param {string} activationUrl
 * @returns {string}
 */
export const getReactivationEmailHTML = (activationUrl) => {
    return `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;"><div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px;"><h2 style="text-align: center; color: #333;">Activate Your Account 🔄</h2><p style="font-size: 16px; color: #444;">Here's your new activation link. Click the button below to complete your registration.</p><div style="text-align: center; margin: 30px 0;"><a href="${activationUrl}"style="background: #4CAF50; color: white; padding: 12px 20px;text-decoration: none; border-radius: 5px; font-weight: bold;">Activate Account</a></div><p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p><p style="word-break: break-all; color: #007BFF;">${activationUrl}</p><hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" /><p style="font-size: 12px; color: #888; text-align: center;">This link is valid for 10 minutes.</br>You can only request for activation three times a day.</br></br>If you did not request this, you can safely ignore this email.</p></div></div>`;
};

/**
 * Forgot-password reset link email body.
 * @param {string} resetUrl
 * @returns {string}
 */
export const getPasswordResetEmailHTML = (resetUrl) => {
    return `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;"><div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px;"><h2 style="text-align: center; color: #333;">Reset Your Password 🔐</h2><p style="font-size: 16px; color: #444;">We received a request to reset your password. Click the button below to set a new one.</p><div style="text-align: center; margin: 30px 0;"><a href="${resetUrl}"style="background: #ff6b35; color: white; padding: 12px 20px;text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a></div><p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p><p style="word-break: break-all; color: #007BFF;">${resetUrl}</p><hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" /><p style="font-size: 12px; color: #888; text-align: center;">This link is valid for 15 minutes.<br/>You can request a password reset up to three times a day.<br/>If you did not request this, you can safely ignore this email.</p></div></div>`;
};

/**
 * Account-suspended email body. Includes the admin's reasoning + a CTA
 * link to the appeal form.
 * @param {string} userName
 * @param {string} reasoning
 * @param {string} appealUrl
 * @returns {string}
 */
export const getSuspensionEmailHTML = (userName, reasoning, appealUrl) => {
    return `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;"><div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px;"><h2 style="text-align: center; color: #b91c1c;">Your account has been suspended 🚫</h2><p style="font-size: 16px; color: #444;">Hello <b>${userName}</b>,</p><p style="font-size: 16px; color: #444;">Your account has been suspended for the following reason:</p><blockquote style="margin: 16px 0; padding: 12px 16px; background: #fef2f2; border-left: 4px solid #b91c1c; color: #7f1d1d; font-style: italic;">${reasoning}</blockquote><p style="font-size: 14px; color: #444;">If you believe this was a mistake, you can file an appeal using the button below.</p><div style="text-align: center; margin: 30px 0;"><a href="${appealUrl}"style="background: #b91c1c; color: white; padding: 12px 20px;text-decoration: none; border-radius: 5px; font-weight: bold;">File an Appeal</a></div><p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p><p style="word-break: break-all; color: #007BFF;">${appealUrl}</p><hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" /><p style="font-size: 12px; color: #888; text-align: center;">Repeated violations may lead to a permanent ban.<br/>If you have questions, reply to this email.</p></div></div>`;
};

/**
 * Appeal-approved email body. `adminNote` is optional and rendered as a
 * blockquote when present.
 * @param {string} userName
 * @param {string} adminNote
 * @param {string} loginUrl
 * @returns {string}
 */
export const getAppealApprovedEmailHTML = (userName, adminNote, loginUrl) => {
    const noteBlock = adminNote
        ? `<p style="font-size: 14px; color: #444;"><b>Admin note:</b></p><blockquote style="margin: 16px 0; padding: 12px 16px; background: #ecfdf5; border-left: 4px solid #16a34a; color: #065f46; font-style: italic;">${adminNote}</blockquote>`
        : "";
    return `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;"><div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px;"><h2 style="text-align: center; color: #16a34a;">Your appeal has been approved ✅</h2><p style="font-size: 16px; color: #444;">Hello <b>${userName}</b>,</p><p style="font-size: 16px; color: #444;">Great news! Your suspension appeal has been <b style="color:#16a34a">approved</b> and your account has been reinstated.</p>${noteBlock}<div style="text-align: center; margin: 30px 0;"><a href="${loginUrl}"style="background: #16a34a; color: white; padding: 12px 20px;text-decoration: none; border-radius: 5px; font-weight: bold;">Log In to Your Account</a></div><p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p><p style="word-break: break-all; color: #007BFF;">${loginUrl}</p><hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" /><p style="font-size: 12px; color: #888; text-align: center;">Please review our community guidelines to avoid future issues.<br/>If you have questions, reply to this email.</p></div></div>`;
};

/**
 * Appeal-rejected email body. No CTA link, the tone is "decision is
 * final unless new information arrives".
 * @param {string} userName
 * @param {string} adminNote
 * @returns {string}
 */
export const getAppealRejectedEmailHTML = (userName, adminNote) => {
    const noteBlock = adminNote
        ? `<p style="font-size: 14px; color: #444;"><b>Reason:</b></p><blockquote style="margin: 16px 0; padding: 12px 16px; background: #fef2f2; border-left: 4px solid #dc2626; color: #7f1d1d; font-style: italic;">${adminNote}</blockquote>`
        : "";
    return `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;"><div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px;"><h2 style="text-align: center; color: #dc2626;">Your appeal has been rejected ❌</h2><p style="font-size: 16px; color: #444;">Hello <b>${userName}</b>,</p><p style="font-size: 16px; color: #444;">After careful review, your suspension appeal has been <b style="color:#dc2626">rejected</b>. Your account remains suspended.</p>${noteBlock}<p style="font-size: 14px; color: #444;">If you believe this is a mistake, please contact support by replying to this email.</p><hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" /><p style="font-size: 12px; color: #888; text-align: center;">This decision is final unless new information becomes available.</p></div></div>`;
};
