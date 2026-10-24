/**
 * CODESRIJAN SECURE EMAIL RELAY — GOOGLE APPS SCRIPT
 * 
 * High-Security, Zero-Cost Server-to-Server Email Relay
 * Uses Google Apps Script MailApp to dispatch transactional emails from Render
 * without triggering outbound SMTP firewall blocks.
 * 
 * Features:
 *  - HMAC-SHA256 Signature Verification
 *  - Timestamp Expiration Window (5 minutes)
 *  - Replay-Resistant Nonce Tracking via CacheService
 *  - Fixed Strict Email Templates (No arbitrary text injection)
 *  - Strict Recipient Email Validation
 *  - Quota Health Monitoring (Consumer Gmail: 100/day, Google Workspace: 1,500/day)
 *  - Zero Credential / OTP Logging
 */

// Shared secret stored in Google Apps Script Script Properties:
// PropertiesService.getScriptProperties().getProperty('CODESRIJAN_RELAY_SECRET')

function getSharedSecret() {
  var secret = PropertiesService.getScriptProperties().getProperty('CODESRIJAN_RELAY_SECRET');
  if (!secret) {
    // Fallback property name check
    secret = PropertiesService.getScriptProperties().getProperty('RELAY_SECRET');
  }
  return secret;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10s for concurrent execution
  } catch (err) {
    return jsonResponse(503, { success: false, error: 'Server busy, retry later.' });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(400, { success: false, error: 'Malformed request: Missing body payload.' });
    }

    // Enforce 64KB maximum payload size to prevent DOS
    if (e.postData.contents.length > 65536) {
      return jsonResponse(413, { success: false, error: 'Payload exceeds 64KB limit.' });
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse(400, { success: false, error: 'Invalid JSON payload.' });
    }

    var secret = getSharedSecret();
    if (!secret) {
      return jsonResponse(500, { success: false, error: 'Relay secret unconfigured in Script Properties.' });
    }

    // 1. Extract authentication headers or body wrapper
    var auth = payload.auth || {};
    var timestamp = auth.timestamp || (e.parameter && e.parameter.timestamp);
    var nonce = auth.nonce || (e.parameter && e.parameter.nonce);
    var signature = auth.signature || (e.parameter && e.parameter.signature);

    if (!timestamp || !nonce || !signature) {
      return jsonResponse(401, { success: false, error: 'Missing HMAC authentication tokens (timestamp, nonce, signature).' });
    }

    // 2. Validate Timestamp (Max 5 minutes clock skew)
    var now = new Date().getTime();
    var reqTime = parseInt(timestamp, 10);
    if (isNaN(reqTime) || Math.abs(now - reqTime) > 300000) {
      return jsonResponse(401, { success: false, error: 'Request expired or clock drift exceeds 5 minutes.' });
    }

    // 3. Replay Defense using CacheService
    var cache = CacheService.getScriptCache();
    var cacheKey = 'nonce_' + nonce;
    if (cache.get(cacheKey)) {
      return jsonResponse(409, { success: false, error: 'Replay detected: nonce has already been consumed.' });
    }

    // 4. Verify HMAC-SHA256 Signature
    // Signature payload format: timestamp + "." + nonce + "." + template + "." + to + "." + JSON.stringify(data)
    var template = (payload.template || '').trim();
    var to = (payload.to || '').trim();
    var data = payload.data || {};

    var messageToSign = reqTime + '.' + nonce + '.' + template + '.' + to + '.' + JSON.stringify(data);
    var expectedSignatureBytes = Utilities.computeHmacSha256Signature(messageToSign, secret, Utilities.Charset.UTF_8);
    var expectedSignatureHex = bytesToHex(expectedSignatureBytes);

    if (expectedSignatureHex.toLowerCase() !== signature.trim().toLowerCase()) {
      return jsonResponse(403, { success: false, error: 'Invalid cryptographic signature.' });
    }
    // Consume only authenticated nonces; forged requests must not poison replay tracking.
    cache.put(cacheKey, 'consumed', 600);

    // 5. Validate Recipient Email
    var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(to)) {
      return jsonResponse(400, { success: false, error: 'Invalid recipient email address syntax.' });
    }
    if (template === 'payment_review_notification') {
      var adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_NOTIFICATION_EMAIL');
      if (!adminEmail || to.toLowerCase() !== adminEmail.trim().toLowerCase()) {
        return jsonResponse(403, { success: false, error: 'Payment notifications require the configured administrator recipient.' });
      }
    }

    // 6. Check Google Mail Quota
    var remainingQuota = MailApp.getRemainingDailyQuota();
    if (remainingQuota < 1) {
      return jsonResponse(429, { success: false, error: 'Daily Google Mail quota exhausted. Quota resets at midnight PST.' });
    }

    // 7. Render Authorized Template Only (Strict Whitelist)
    var emailContent = renderTemplate(template, data);
    if (!emailContent) {
      return jsonResponse(400, { success: false, error: 'Unsupported template: ' + template });
    }

    // 8. Dispatch Email via MailApp
    MailApp.sendEmail({
      to: to,
      subject: emailContent.subject,
      htmlBody: emailContent.html,
      name: 'CodeSrijan'
    });

    var maskedUser = to.split('@')[0];
    var maskedDomain = to.split('@')[1];
    var safeMask = (maskedUser.length > 2 ? maskedUser.substring(0, 2) : maskedUser) + '***@' + maskedDomain;

    return jsonResponse(200, {
      success: true,
      recipient: safeMask,
      template: template,
      remainingQuota: remainingQuota - 1,
      timestamp: now
    });

  } catch (fatalErr) {
    return jsonResponse(500, { success: false, error: 'Relay dispatch failure: ' + fatalErr.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var remainingQuota = MailApp.getRemainingDailyQuota();
  return jsonResponse(200, {
    status: 'online',
    service: 'CodeSrijan Secure MailApp Relay',
    remainingDailyQuota: remainingQuota,
    timestamp: new Date().getTime()
  });
}

function renderTemplate(template, data) {
  if (template === 'payment_review_notification') {
    var fields = ['eventName', 'registrationName', 'registrationReference', 'currency', 'transactionReference', 'submittedAt', 'reviewUrl'];
    if (!fields.every(function (key) { return typeof data[key] === 'string' && data[key].trim() && data[key].length <= 500; })) return null;
    if (typeof data.feeAmount !== 'number' || !isFinite(data.feeAmount) || data.feeAmount < 0 || !/^[A-Z]{3}$/.test(data.currency)) return null;
    if (isNaN(Date.parse(data.submittedAt))) return null;
    var frontend = PropertiesService.getScriptProperties().getProperty('FRONTEND_URL');
    if (!frontend || !/^https?:\/\/[^\s"'<>?#]+$/.test(frontend)) return null;
    var reviewUrl = frontend.replace(/\/+$/, '') + '/admin/payments';
    if (data.reviewUrl !== reviewUrl) return null;
    var rows = [
      ['Event', data.eventName], ['Registration', data.registrationName],
      ['Reference', data.registrationReference], ['Expected fee', data.feeAmount + ' ' + data.currency],
      ['Transaction reference (admin review only)', data.transactionReference], ['Submitted at', data.submittedAt]
    ];
    return {
      subject: 'CodeSrijan [PAYMENT REVIEW REQUIRED]',
      html: '<h1>CodeSrijan payment-review notification</h1>' + rows.map(function (row) {
        return '<p><strong>' + escapeHtml(row[0]) + ':</strong> ' + escapeHtml(row[1]) + '</p>';
      }).join('') + '<p><a href="' + escapeHtml(reviewUrl) + '">Open Admin Payment Review Queue</a></p>'
    };
  }
  if (template === 'verification_otp') {
    var code = (data.code || '').trim();
    if (!/^\d{6}$/.test(code)) return null;

    return {
      subject: 'CodeSrijan [IDENTITY VERIFICATION PASSKEY]',
      html: '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0B0F14; padding: 40px 20px; font-family: Helvetica, Arial, sans-serif;">' +
        '<tr><td align="center">' +
        '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #121A26; border: 2px solid #223249; border-radius: 8px; overflow: hidden;">' +
        '<tr><td style="background-color: #182334; border-bottom: 2px solid #223249; padding: 24px; text-align: center;">' +
        '<h1 style="margin: 0; color: #F4F7FB; font-size: 24px; font-weight: 900; letter-spacing: 3px; font-family: monospace;">CODESRIJAN</h1>' +
        '<p style="margin: 8px 0 0 0; color: #22D3EE; font-size: 11px; font-family: monospace; letter-spacing: 2px;">IDENTITY_VERIFICATION_PROTOCOL</p>' +
        '</td></tr>' +
        '<tr><td style="padding: 40px 32px;">' +
        '<h2 style="margin: 0 0 16px 0; color: #F4F7FB; font-size: 18px; font-weight: 700; text-transform: uppercase;">Incoming Verification Transmission</h2>' +
        '<p style="margin: 0 0 24px 0; color: #A9B5C5; font-size: 15px; line-height: 1.6;">' +
        'This address was registered on the CodeSrijan Mainframe. To confirm authorization and finalize your operative account, input your secure 6-digit passkey:' +
        '</p>' +
        '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0B0F14; border: 2px dashed #7C3AED; border-radius: 6px;">' +
        '<tr><td align="center" style="padding: 28px;">' +
        '<p style="margin: 0 0 8px 0; color: #A9B5C5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Secure Passkey</p>' +
        '<h1 style="margin: 0; color: #22D3EE; font-size: 44px; font-family: monospace; font-weight: 900; letter-spacing: 10px;">' + code + '</h1>' +
        '</td></tr></table>' +
        '<p style="margin: 24px 0 0 0; color: #64748B; font-size: 13px; line-height: 1.5;">' +
        'This verification passkey will expire in <strong>15 minutes</strong> and can only be used once. Never disclose this transmission to anyone.' +
        '</p></td></tr>' +
        '<tr><td style="background-color: #0B0F14; border-top: 1px solid #223249; padding: 20px; text-align: center;">' +
        '<p style="margin: 0; color: #64748B; font-size: 12px; font-family: monospace;">If you did not initiate this sequence, you may safely ignore this transmission.</p>' +
        '</td></tr></table></td></tr></table>'
    };
  }

  if (template === 'password_reset') {
    var rawLink = (data.resetLink || '').trim();
    if (!rawLink.startsWith('http://') && !rawLink.startsWith('https://')) return null;

    var sanitizedLink = rawLink.replace(/"/g, '&quot;');

    return {
      subject: 'CodeSrijan [PASSWORD RESET AUTHORIZATION]',
      html: '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0B0F14; padding: 40px 20px; font-family: Helvetica, Arial, sans-serif;">' +
        '<tr><td align="center">' +
        '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #121A26; border: 2px solid #223249; border-radius: 8px; overflow: hidden;">' +
        '<tr><td style="background-color: #182334; border-bottom: 2px solid #223249; padding: 24px; text-align: center;">' +
        '<h1 style="margin: 0; color: #F4F7FB; font-size: 24px; font-weight: 900; letter-spacing: 3px; font-family: monospace;">CODESRIJAN</h1>' +
        '<p style="margin: 8px 0 0 0; color: #F59E0B; font-size: 11px; font-family: monospace; letter-spacing: 2px;">KEY_RECOVERY_PROTOCOL</p>' +
        '</td></tr>' +
        '<tr><td style="padding: 40px 32px;">' +
        '<h2 style="margin: 0 0 16px 0; color: #F4F7FB; font-size: 18px; font-weight: 700;">Password Reset Requested</h2>' +
        '<p style="margin: 0 0 24px 0; color: #A9B5C5; font-size: 15px; line-height: 1.6;">' +
        'A request was received to reinitialize the cryptographic credentials for your operative account. Click the authorized button below to create a new password:' +
        '</p>' +
        '<div style="text-align: center; margin: 32px 0;">' +
        '<a href="' + sanitizedLink + '" style="background-color: #22D3EE; color: #0B0F14; padding: 14px 28px; text-decoration: none; font-weight: 800; font-family: monospace; letter-spacing: 1px; border-radius: 4px; display: inline-block;">RESET CREDENTIALS</a>' +
        '</div>' +
        '<p style="margin: 24px 0 0 0; color: #64748B; font-size: 13px; line-height: 1.5;">' +
        'This recovery authorization link is single-use and will expire in <strong>1 hour</strong>.' +
        '</p></td></tr></table></td></tr></table>'
    };
  }

  if (template === 'welcome') {
    var name = (data.name || 'Operative').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return {
      subject: 'CodeSrijan // Identity Verification Confirmed',
      html: '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0B0F14; padding: 40px 20px; font-family: Helvetica, Arial, sans-serif;">' +
        '<tr><td align="center">' +
        '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #121A26; border: 2px solid #223249; border-radius: 8px; overflow: hidden;">' +
        '<tr><td style="background-color: #182334; border-bottom: 2px solid #223249; padding: 24px; text-align: center;">' +
        '<h1 style="margin: 0; color: #F4F7FB; font-size: 24px; font-weight: 900; letter-spacing: 3px; font-family: monospace;">CODESRIJAN</h1>' +
        '<p style="margin: 8px 0 0 0; color: #10B981; font-size: 11px; font-family: monospace; letter-spacing: 2px;">CLEARANCE_GRANTED</p>' +
        '</td></tr>' +
        '<tr><td style="padding: 40px 32px;">' +
        '<h2 style="margin: 0 0 16px 0; color: #F4F7FB; font-size: 18px; font-weight: 700;">Welcome to the Arena, ' + name + '</h2>' +
        '<p style="margin: 0 0 24px 0; color: #A9B5C5; font-size: 15px; line-height: 1.6;">' +
        'Your cryptographic identity has been verified on the CodeSrijan Mainframe. You can now build or join squads, enroll in tournament tracks, and submit solutions.' +
        '</p></td></tr></table></td></tr></table>'
    };
  }

  if (template === 'payment_rejected') {
    var name = escapeHtml(data.name || 'Operative');
    var eventName = escapeHtml(data.eventName || 'Tournament');
    var teamName = data.teamName ? escapeHtml(data.teamName) : '';
    var reason = escapeHtml(data.reason || 'Transaction proof could not be verified against banking records.');
    var utr = data.transactionReference ? escapeHtml(data.transactionReference) : '';
    var fee = (typeof data.feeAmount === 'number' || typeof data.feeAmount === 'string') ? escapeHtml(data.feeAmount + ' ' + (data.currency || 'INR')) : '';
    var retryUrl = (data.retryUrl && /^https?:\/\/[^\s"'<>?#]+$/.test(data.retryUrl)) ? escapeHtml(data.retryUrl) : 'https://codesrijan-nine.vercel.app/payment';

    return {
      subject: 'CodeSrijan [PAYMENT REVIEW: DECLINED - ' + eventName + ']',
      html: '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0B0F14; padding: 40px 20px; font-family: Helvetica, Arial, sans-serif;">' +
        '<tr><td align="center">' +
        '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #121A26; border: 2px solid #E11D48; border-radius: 8px; overflow: hidden;">' +
        '<tr><td style="background-color: #881337; border-bottom: 2px solid #E11D48; padding: 24px; text-align: center;">' +
        '<h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 900; letter-spacing: 3px; font-family: monospace;">CODESRIJAN</h1>' +
        '<p style="margin: 8px 0 0 0; color: #FDA4AF; font-size: 11px; font-family: monospace; letter-spacing: 2px;">PAYMENT_AUDIT_TRANSMISSION // DECLINED</p>' +
        '</td></tr>' +
        '<tr><td style="padding: 40px 32px;">' +
        '<h2 style="margin: 0 0 16px 0; color: #F4F7FB; font-size: 18px; font-weight: 700;">Payment Verification Notice</h2>' +
        '<p style="margin: 0 0 20px 0; color: #A9B5C5; font-size: 15px; line-height: 1.6;">Hello <strong>' + name + '</strong>,</p>' +
        '<p style="margin: 0 0 20px 0; color: #A9B5C5; font-size: 15px; line-height: 1.6;">Your tournament entry payment for <strong>' + eventName + '</strong>' + (teamName ? ' (Squad: <strong>' + teamName + '</strong>)' : '') + ' has been reviewed and <strong style="color: #F43F5E;">DECLINED</strong> by the tournament administration.</p>' +
        '<div style="background-color: #1C1917; border-left: 4px solid #F43F5E; padding: 18px; margin: 24px 0; border-radius: 4px;">' +
        '<p style="margin: 0 0 6px 0; color: #F43F5E; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Rejection Reason</p>' +
        '<p style="margin: 0 0 12px 0; color: #FFFFFF; font-size: 14px; font-weight: 600;">' + reason + '</p>' +
        (utr ? '<p style="margin: 0 0 4px 0; color: #A8A29E; font-size: 11px; font-weight: 700; text-transform: uppercase;">Submitted UTR / Reference:</p><p style="margin: 0 0 10px 0; color: #E0E7FF; font-family: monospace; font-size: 13px;">' + utr + '</p>' : '') +
        (fee ? '<p style="margin: 0 0 4px 0; color: #A8A29E; font-size: 11px; font-weight: 700; text-transform: uppercase;">Expected Fee:</p><p style="margin: 0; color: #E0E7FF; font-family: monospace; font-size: 13px;">' + fee + '</p>' : '') +
        '</div>' +
        '<p style="margin: 0 0 24px 0; color: #A9B5C5; font-size: 14px; line-height: 1.6;"><strong>How to resolve:</strong><br/>Please verify your transaction receipt, ensure the 12-digit UTR is accurately transcribed, and re-submit your proof of payment via the tournament dashboard.</p>' +
        '<div style="text-align: center; margin: 28px 0;">' +
        '<a href="' + retryUrl + '" target="_blank" style="background-color: #E11D48; color: #FFFFFF; font-weight: 800; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 4px; display: inline-block; font-size: 13px; letter-spacing: 1px;">RESUBMIT PAYMENT PROOF</a>' +
        '</div>' +
        '<p style="margin: 20px 0 0 0; color: #64748B; font-size: 12px; font-family: monospace;">CodeSrijan Automated Tournament Protocol</p>' +
        '</td></tr></table></td></tr></table>'
    };
  }

  return null;
}

function bytesToHex(bytes) {
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = (bytes[i] & 0xFF).toString(16);
    if (b.length === 1) hex += '0';
    hex += b;
  }
  return hex;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function jsonResponse(statusCode, data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
