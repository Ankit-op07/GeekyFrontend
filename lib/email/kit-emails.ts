/**
 * ─── Kit access emails ─────────────────────────────────────────────────────
 *
 *  Two bodies, picked per recipient at send time:
 *
 *   • buildKitOnboardingEmail — the original onboarding mail. Leads with a
 *     set-password link. For people who have no account yet, or have one but
 *     have never chosen a password.
 *
 *   • buildKitLiveEmail — for existing users who already log in fine. Sending
 *     them "set your password" reads as a phishing mail or an account reset, so
 *     this variant just tells them the kit is now on the platform and links
 *     straight to it.
 *
 *  buildKitOnboardingEmail was lifted verbatim out of
 *  app/api/admin/kit-onboarding/route.ts so the campaign sender and the
 *  existing onboarding screen cannot drift apart.
 * ──────────────────────────────────────────────────────────────────────────
 */

const FALLBACK_BASE_URL = 'https://geekyfrontend.com';
const SUPPORT_EMAIL = 'geekyfrontend@gmail.com';

/** Kit-appropriate emoji, matched on the display name. */
export function kitEmojiFor(kitName: string): string {
    const n = kitName.toLowerCase();
    if (n.includes('react')) return '⚛️';
    if (n.includes('js') || n.includes('javascript')) return '🟨';
    if (n.includes('node')) return '🟢';
    if (n.includes('dsa') || n.includes('company')) return '🧮';
    if (n.includes('placement')) return '🎓';
    if (n.includes('complete') || n.includes('system design')) return '🏆';
    return '📚';
}

export function buildKitOnboardingEmail({
    recipientEmail,
    recipientName,
    kitName,
    setPasswordLink,
    personalNote,
}: {
    recipientEmail: string;
    recipientName: string;
    kitName: string;
    setPasswordLink: string;
    personalNote?: string;
}): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || FALLBACK_BASE_URL;
    const kitEmoji = kitEmojiFor(kitName);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Geeky Frontend — Your Kit Access is Ready!</title>
</head>
<body style="margin:0;padding:0;background:#f0f2ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;">

    <!-- ══════════ HERO ══════════ -->
    <tr>
      <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:52px 36px 48px;text-align:center;border-radius:0 0 0 0;">
        <div style="font-size:64px;line-height:1;margin-bottom:20px;">${kitEmoji}</div>
        <h1 style="color:#fff;font-size:30px;font-weight:800;margin:0 0 14px;line-height:1.3;letter-spacing:-0.5px;">
          Welcome to Geeky Frontend!<br>
          <span style="font-size:22px;font-weight:600;opacity:0.9;">Your access is ready 🎉</span>
        </h1>
        <p style="color:rgba(255,255,255,0.88);font-size:16px;margin:0;line-height:1.6;">
          Hey <strong style="color:#fff;">${recipientName}</strong>, we've set up your account<br>and granted access to your interview kit.
        </p>
      </td>
    </tr>

    <!-- ══════════ BODY ══════════ -->
    <tr>
      <td style="background:#fff;padding:44px 36px 36px;">

        <!-- Greeting -->
        <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 24px;">
          We're super excited to have you on board! 🙌 You're about to dive into one of the most comprehensive interview prep kits out there.
        </p>

        ${personalNote ? `
        <!-- Personal note -->
        <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 10px 10px 0;padding:16px 22px;margin-bottom:28px;">
          <p style="color:#92400e;font-size:11px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">💬 Message from the team</p>
          <p style="color:#78350f;font-size:15px;line-height:1.75;margin:0;">${personalNote}</p>
        </div>
        ` : ''}

        <!-- Kit card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:14px;padding:28px 28px 24px;">
              <p style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 6px;">📦 Your Kit</p>
              <h2 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 10px;line-height:1.3;">${kitEmoji} ${kitName}</h2>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.65;margin:0 0 20px;">
                Lifetime access · All topics included · Regular updates · Interview-ready content
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#fff;">
                    <a href="${baseUrl}/dashboard" target="_blank"
                       style="display:inline-block;padding:13px 28px;color:#667eea;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;">
                      Go to My Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Step 1: Set Password -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="background:#f0f4ff;border:2px solid #667eea;border-radius:14px;padding:28px;">
              <p style="color:#4338ca;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 6px;">Step 1 of 2</p>
              <h3 style="color:#1e1b4b;font-size:20px;font-weight:700;margin:0 0 12px;">🔐 Set Your Account Password</h3>
              <p style="color:#555;font-size:14px;line-height:1.75;margin:0 0 22px;">
                Your account has been created with your email. Click the button below to set a password — it only takes 30 seconds!
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:9px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
                    <a href="${setPasswordLink}" target="_blank"
                       style="display:inline-block;padding:14px 34px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;border-radius:9px;letter-spacing:0.2px;">
                      Set My Password →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:12px;margin:14px 0 0;">
                ⏰ Link valid for <strong>7 days</strong> · Having trouble?
                <a href="mailto:${SUPPORT_EMAIL}" style="color:#667eea;text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Step 2: Access content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="background:#f8fffe;border:2px solid #10b981;border-radius:14px;padding:24px 28px;">
              <p style="color:#065f46;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 6px;">Step 2 of 2</p>
              <h3 style="color:#064e3b;font-size:20px;font-weight:700;margin:0 0 10px;">🚀 Start Learning</h3>
              <p style="color:#555;font-size:14px;line-height:1.7;margin:0;">
                After setting your password, log in and head to your dashboard. Your entire ${kitEmoji} <strong>${kitName}</strong> content is already there, organised by topic and ready to access.
              </p>
            </td>
          </tr>
        </table>

        <!-- What's inside -->
        <div style="background:#f9fafb;border-radius:12px;padding:22px 26px;margin-bottom:32px;">
          <p style="color:#374151;font-size:14px;font-weight:700;margin:0 0 14px;">✨ What's inside the platform</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;line-height:1.55;">📖 <strong>In-depth articles</strong> on every interview topic</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;line-height:1.55;">💡 <strong>Real interview questions</strong> with scripted answers</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;line-height:1.55;">🔁 <strong>Progress tracking</strong> — mark what you've completed</p>
          <p style="color:#6b7280;font-size:14px;margin:0;line-height:1.55;">🔄 <strong>Lifetime updates</strong> — fresh content added regularly</p>
        </div>

        <!-- Account info -->
        <div style="background:#f0f4ff;border-radius:10px;padding:18px 22px;margin-bottom:32px;">
          <p style="color:#4338ca;font-size:13px;font-weight:600;margin:0 0 10px;">📋 Your Account Details</p>
          <p style="color:#555;font-size:14px;margin:0 0 6px;">
            📧 Email: <strong>${recipientEmail}</strong>
          </p>
          <p style="color:#555;font-size:14px;margin:0;">
            🔗 Login at:
            <a href="${baseUrl}/login" style="color:#667eea;text-decoration:none;font-weight:600;">${baseUrl.replace('https://', '')}/login</a>
          </p>
        </div>

        <!-- Sign off -->
        <p style="color:#555;font-size:15px;line-height:1.85;margin:0 0 8px;">
          We've put a lot of love into this platform and we can't wait to hear about your success story. If you have any questions, just reply to this email. 💜
        </p>
        <p style="color:#777;font-size:14px;margin:0;">
          Happy learning,<br>
          <strong style="color:#333;font-size:15px;">The Geeky Frontend Team</strong>
        </p>

      </td>
    </tr>

    <!-- ══════════ FOOTER ══════════ -->
    <tr>
      <td style="background:#f8f9fa;padding:22px 36px;text-align:center;border-radius:0 0 12px 12px;">
        <p style="color:#bbb;font-size:12px;margin:0;line-height:1.7;">
          © 2025 Geeky Frontend · All rights reserved.<br>
          Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#667eea;text-decoration:none;">${SUPPORT_EMAIL}</a>
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`;
}

/**
 * For buyers who ALREADY have a working account+password. No set-password step
 * — the whole message is "the kit you bought is now live on the platform, and
 * it's already unlocked in your dashboard".
 */
export function buildKitLiveEmail({
    recipientEmail,
    recipientName,
    kitName,
    kitUrl,
    personalNote,
}: {
    recipientEmail: string;
    recipientName: string;
    kitName: string;
    /** Deep link to the kit reader, e.g. /learn/nodejs-backend-kit */
    kitUrl: string;
    personalNote?: string;
}): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || FALLBACK_BASE_URL;
    const kitEmoji = kitEmojiFor(kitName);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${kitName} is now live on Geeky Frontend</title>
</head>
<body style="margin:0;padding:0;background:#f0f2ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;">

    <!-- ══════════ HERO ══════════ -->
    <tr>
      <td style="background:linear-gradient(135deg,#0ea5e9 0%,#10b981 100%);padding:48px 36px 44px;text-align:center;">
        <div style="font-size:60px;line-height:1;margin-bottom:18px;">${kitEmoji}</div>
        <h1 style="color:#fff;font-size:28px;font-weight:800;margin:0 0 12px;line-height:1.3;letter-spacing:-0.5px;">
          Your ${kitName} is live 🎉
        </h1>
        <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:0;line-height:1.6;">
          Hey <strong style="color:#fff;">${recipientName}</strong> — it's already unlocked<br>in your Geeky Frontend dashboard.
        </p>
      </td>
    </tr>

    <!-- ══════════ BODY ══════════ -->
    <tr>
      <td style="background:#fff;padding:40px 36px 36px;">

        <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 24px;">
          You bought the <strong>${kitName}</strong> from us earlier — thank you for that. 🙏 We've now rebuilt it as a full course inside the platform, and your existing purchase carries over at no extra cost.
        </p>

        ${personalNote ? `
        <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 10px 10px 0;padding:16px 22px;margin-bottom:28px;">
          <p style="color:#92400e;font-size:11px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">💬 Message from the team</p>
          <p style="color:#78350f;font-size:15px;line-height:1.75;margin:0;">${personalNote}</p>
        </div>
        ` : ''}

        <!-- Primary CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9 0%,#10b981 100%);border-radius:14px;padding:28px;text-align:center;">
              <p style="color:rgba(255,255,255,0.75);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:0 0 8px;">✅ Already unlocked</p>
              <h2 style="color:#fff;font-size:21px;font-weight:800;margin:0 0 18px;line-height:1.35;">${kitEmoji} ${kitName}</h2>
              <table cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="border-radius:9px;background:#fff;">
                    <a href="${kitUrl}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#0f766e;text-decoration:none;font-weight:700;font-size:15px;border-radius:9px;">
                      Start Learning →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- What changed -->
        <div style="background:#f9fafb;border-radius:12px;padding:22px 26px;margin-bottom:30px;">
          <p style="color:#374151;font-size:14px;font-weight:700;margin:0 0 14px;">✨ What's different from the version you bought</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;line-height:1.55;">📖 <strong>Read it in the browser</strong> — no PDFs, no downloads</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;line-height:1.55;">🔁 <strong>Progress tracking</strong> — pick up exactly where you left off</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;line-height:1.55;">🔖 <strong>Bookmarks &amp; end-of-topic quizzes</strong> to check what stuck</p>
          <p style="color:#6b7280;font-size:14px;margin:0;line-height:1.55;">🔄 <strong>Lifetime updates</strong> — new topics appear automatically</p>
        </div>

        <!-- Account info -->
        <div style="background:#f0f4ff;border-radius:10px;padding:18px 22px;margin-bottom:30px;">
          <p style="color:#4338ca;font-size:13px;font-weight:600;margin:0 0 10px;">📋 Your Account</p>
          <p style="color:#555;font-size:14px;margin:0 0 6px;">
            📧 Log in with: <strong>${recipientEmail}</strong>
          </p>
          <p style="color:#555;font-size:14px;margin:0;">
            🔗 <a href="${baseUrl}/login" style="color:#667eea;text-decoration:none;font-weight:600;">${baseUrl.replace('https://', '')}/login</a>
            · Forgot your password? Use "Forgot password" on that page.
          </p>
        </div>

        <p style="color:#555;font-size:15px;line-height:1.85;margin:0 0 8px;">
          If anything looks wrong — the kit isn't showing, or you're not sure which email you bought with — just reply to this mail and we'll sort it out. 💜
        </p>
        <p style="color:#777;font-size:14px;margin:0;">
          Happy learning,<br>
          <strong style="color:#333;font-size:15px;">The Geeky Frontend Team</strong>
        </p>

      </td>
    </tr>

    <!-- ══════════ FOOTER ══════════ -->
    <tr>
      <td style="background:#f8f9fa;padding:22px 36px;text-align:center;border-radius:0 0 12px 12px;">
        <p style="color:#bbb;font-size:12px;margin:0;line-height:1.7;">
          © 2025 Geeky Frontend · All rights reserved.<br>
          Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#667eea;text-decoration:none;">${SUPPORT_EMAIL}</a>
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`;
}
