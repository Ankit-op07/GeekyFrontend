// lib/email/membership-emails.ts
//
// The confirmation sent when a membership starts or is extended.
//
// Sent from the WEBHOOK, not from the client verify callback — the same rule
// the kit onboarding email and recordRedemption() follow. The webhook is the
// server-to-server confirmation that arrives even when the buyer closed the tab
// mid-payment, so exactly one place owns the send and there is no race.

/** Dates are rendered in IST and SAID to be IST — an email has no browser to
 *  resolve the reader's zone, and an unlabelled expiry date invites a dispute. */
function formatIstDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

/** Escape everything interpolated — `userName` is user-supplied. */
function esc(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * "Your membership ends in N days."
 *
 * Sent from the renewal sweep (lib/membership-reminders.ts), which piggybacks on
 * the contests cron. Deliberately short and factual: the reader is an existing
 * paying customer, and re-pitching the product to them reads as though we have
 * forgotten who they are. Give them the date and a link.
 */
export function buildMembershipRenewalEmail({
    userName,
    daysLeft,
    expiresAt,
    membershipUrl,
}: {
    userName: string;
    daysLeft: number;
    expiresAt: Date;
    membershipUrl: string;
}): { subject: string; html: string; text: string } {
    const until = formatIstDate(expiresAt);
    const window =
        daysLeft <= 1 ? 'tomorrow' : `in ${daysLeft} days`;

    const subject =
        daysLeft <= 1
            ? 'Your Geeky Frontend membership ends tomorrow'
            : `Your Geeky Frontend membership ends in ${daysLeft} days`;

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0b0b12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b12;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#14141f;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#fbbf24;letter-spacing:.04em;text-transform:uppercase;">Membership ending</p>
            <h1 style="margin:0;font-size:23px;line-height:1.3;color:#ffffff;font-weight:700;">
              Hi ${esc(userName)}, your membership ends ${esc(window)}.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 0;">
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#c7c7d4;">
              Access to the kits, the DSA sheet, contests and the job board runs until
              <strong style="color:#ffffff;">${esc(until)}</strong>. Renew and the new term is added
              on top — you won't lose the days you have left.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="border-radius:10px;background:#7c3aed;">
                  <a href="${membershipUrl}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Renew membership →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;border-top:1px solid #24243a;">
            <!-- The reassurance, so an expiring membership never reads as
                 "you are about to lose everything". -->
            <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#6b6b80;">
              If it lapses, any kits you bought outright stay yours permanently, and your notes,
              bookmarks and DSA progress are kept — they come straight back whenever you renew.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

    const text = `Hi ${userName}, your Geeky Frontend membership ends ${window} (${until} IST).

Renew: ${membershipUrl}

Renewing adds the new term on top of the days you have left. If it lapses, kits you bought outright stay yours permanently and your notes and progress are kept.`;

    return { subject, html, text };
}

export function buildMembershipEmail({
    userName,
    planLabel,
    expiresAt,
    dashboardUrl,
}: {
    userName: string;
    planLabel: string;
    expiresAt: Date;
    dashboardUrl: string;
}): string {
    const until = formatIstDate(expiresAt);

    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0b0b12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b12;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#14141f;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#a78bfa;letter-spacing:.04em;text-transform:uppercase;">Membership active</p>
            <h1 style="margin:0;font-size:24px;line-height:1.3;color:#ffffff;font-weight:700;">
              You're in, ${esc(userName)}.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 0;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#c7c7d4;">
              Your <strong style="color:#ffffff;">${esc(planLabel)}</strong> membership is live. That's
              every kit, the DSA sheet, contests and the job board — all of it, unlocked.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#1c1c2b;border-radius:12px;margin:0 0 20px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:12px;color:#8b8b9e;">Access until</p>
                  <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${esc(until)}</p>
                  <p style="margin:6px 0 0;font-size:12px;color:#8b8b9e;">Indian Standard Time</p>
                </td>
              </tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="border-radius:10px;background:#7c3aed;">
                  <a href="${dashboardUrl}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Start learning →</a>
                </td>
              </tr>
            </table>
            <!-- Renewals stack rather than reset (computeMembershipExpiry), so
                 saying so here prevents the obvious support question from
                 someone who renews early and expects a fresh full term. -->
            <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#8b8b9e;">
              Renew any time before ${esc(until)} and the new term is added to what's left —
              you never lose days you've already paid for.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;border-top:1px solid #24243a;">
            <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#6b6b80;">
              Any kits you bought outright stay yours permanently, membership or not.
              <br/>Questions? Just reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}
