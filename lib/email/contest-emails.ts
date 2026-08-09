// lib/email/contest-emails.ts
//
// The morning-of reminder for contests a learner has planned.
//
// ⚠️  WHY "MORNING OF" AND NOT "ONE HOUR BEFORE", because the promise in the UI
// has to match what the infrastructure can actually do:
//
// Reminders are sent by a Vercel cron, and this project is on the HOBBY plan,
// where crons run at DAILY granularity only. There is no runner that can wake
// up sixty minutes before an arbitrary contest. A digest sent once a day is
// therefore the finest reminder we can honestly offer, and the UI says exactly
// that rather than implying something sharper.
//
// The cron fires at 03:00 UTC — 08:30 IST — which is a deliberate choice for an
// India-first audience: it lands as a morning email on the day of the contest,
// early enough to rearrange an evening around it.

export interface ContestReminderItem {
    name: string;
    url: string;
    platform: string;
    startsAt: Date;
}

const PLATFORM_LABELS: Record<string, string> = {
    codeforces: 'Codeforces',
    atcoder: 'AtCoder',
    codechef: 'CodeChef',
    leetcode: 'LeetCode',
};

/**
 * Times are rendered in IST and SAID to be IST.
 *
 * An email has no browser to resolve the reader's zone, so the only safe thing
 * is to pick one and label it. IST because the audience is Indian; an unlabelled
 * time is how someone misses a contest by five and a half hours.
 */
function formatIst(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(date);
}

/** Escape anything interpolated into the HTML. The contest name comes from a
 *  third-party feed, so it is untrusted input in an email we send. */
function esc(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function buildContestReminderEmail({
    name,
    contests,
}: {
    name?: string;
    contests: ContestReminderItem[];
}): { subject: string; html: string; text: string } {
    const greeting = name ? `Hi ${name.split(' ')[0]}` : 'Hi';
    const many = contests.length > 1;

    const subject = many
        ? `${contests.length} contests you planned are today`
        : `${contests[0].name} is today`;

    const rows = contests
        .map(
            (c) => `
      <tr>
        <td style="padding:14px 16px;border:1px solid #e6e6ef;border-radius:10px;background:#ffffff;">
          <div style="font-size:12px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:.04em;">
            ${esc(PLATFORM_LABELS[c.platform] || c.platform)}
          </div>
          <div style="margin-top:4px;font-size:16px;font-weight:600;color:#0f172a;">
            ${esc(c.name)}
          </div>
          <div style="margin-top:4px;font-size:14px;color:#475569;">
            Starts ${esc(formatIst(c.startsAt))} IST
          </div>
          <a href="${esc(c.url)}"
             style="display:inline-block;margin-top:10px;font-size:14px;font-weight:600;color:#7c3aed;text-decoration:none;">
            Open the contest →
          </a>
        </td>
      </tr>
      <tr><td style="height:10px;"></td></tr>`
        )
        .join('');

    const html = `
<div style="margin:0;padding:24px;background:#f7f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;">
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a;">
      ${esc(greeting)} — ${many ? 'your contests are' : 'your contest is'} today
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
      You marked ${many ? 'these' : 'this'} on your Geeky Frontend contest board.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>

    <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
      You get this because you marked ${many ? 'these contests' : 'this contest'} as planned.
      Un-mark ${many ? 'them' : 'it'} on the contest board to stop the reminder.
    </p>
  </div>
</div>`.trim();

    const text = [
        `${greeting} — ${many ? 'your contests are' : 'your contest is'} today.`,
        '',
        ...contests.map(
            (c) =>
                `• ${c.name} (${PLATFORM_LABELS[c.platform] || c.platform})\n  ${formatIst(
                    c.startsAt
                )} IST\n  ${c.url}`
        ),
        '',
        'You get this because you marked them as planned on your Geeky Frontend contest board.',
    ].join('\n');

    return { subject, html, text };
}
