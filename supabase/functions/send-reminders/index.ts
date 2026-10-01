// Hourly-ish (cron → POST with x-cron-secret): email every due reminder.
// Public GET/POST ?unsub=<id>&sig=<hmac>: one-click unsubscribe for that subscription.
// Public POST ?resub=<id>&sig=<hmac>: the "oops, undo" button on the unsubscribe page.
import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6';

const env = (k: string) => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`missing env ${k}`);
  return v;
};
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
const SECRET = env('CRON_SECRET');
// Hosted Supabase rewrites text/html GET responses to text/plain unless the function is
// served from a custom domain. So: plain-text pages by default; set PUBLIC_FUNCTION_URL
// (this function's URL on your custom domain) to switch links + pages to the styled HTML.
const PUBLIC_URL = Deno.env.get('PUBLIC_FUNCTION_URL');
const SELF_URL = PUBLIC_URL ?? `${env('SUPABASE_URL')}/functions/v1/send-reminders`;

// Mail goes out over SMTP — by default a Gmail account with an app password (no domain needed).
// Port 465 (implicit TLS): hosted edge functions block outbound 25 and 587.
// ponytail: Gmail caps at ~500 recipients/day; move to a provider with a domain past that.
let mailer: ReturnType<typeof nodemailer.createTransport> | undefined;
function smtp() {
  if (!mailer) {
    const port = Number(Deno.env.get('SMTP_PORT') ?? 465);
    mailer = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: Deno.env.get('SMTP_PASS') ? { user: env('SMTP_USER'), pass: env('SMTP_PASS') } : undefined,
    });
  }
  return mailer;
}

type Cycle = 'monthly' | 'quarterly' | 'yearly' | 'custom_days' | 'one_time';
export type Due = {
  subscription_id: string; due_date: string; days_before: number; days_left: number; email: string;
  name: string; price: number; currency: string; type: 'auto_renew' | 'expires' | 'free_trial'; portal_url: string | null;
  color: string; billing_cycle: Cycle; reminder_hour: number;
};

async function sign(id: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id));
  return btoa(String.fromCharCode(...new Uint8Array(mac))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]!);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const money = (n: number, cur: string) => {
  try {
    const dp = cur === 'INR' ? 0 : undefined;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n);
  } catch {
    return `${cur} ${Number(n).toFixed(cur === 'INR' ? 0 : 2)}`;
  }
};
const when = (d: number) => (d <= 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`);
// "2026-10-02" → "Fri, Oct 2". Parsed as a calendar date in UTC so no timezone shift.
const fmt = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  return isNaN(+d) ? ymd : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
};
const CYC: Record<Cycle, string> = { monthly: '/mo', quarterly: '/qtr', yearly: '/yr', custom_days: '/custom', one_time: ' once' };
const TYPES = { auto_renew: 'auto-renew', expires: 'expires', free_trial: 'free trial' } as const;
const CYCLES: Record<Cycle, string> = { monthly: 'monthly', quarterly: 'quarterly', yearly: 'yearly', custom_days: 'custom', one_time: 'one-time' };

const SANS = `'Bricolage Grotesque',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif`;
const MONO = `'DM Mono',ui-monospace,Menlo,monospace`;
const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;800&family=DM+Mono&display=swap" rel="stylesheet">';

// Same copy as the design prototype (mailSubject / line() / mailMsg).
function copy(r: Due) {
  const w = when(r.days_left), p = money(r.price, r.currency), date = fmt(r.due_date);
  switch (r.type) {
    case 'free_trial':
      return { subject: `⏳ your ${r.name} trial ends ${w}`, head: `${r.name} trial ends ${w}. cancel or commit.`,
        msg: `your free trial turns paid on ${date}. cancel before then if you don’t want the charge.` };
    case 'expires':
      return { subject: `⌛ ${r.name} expires ${w}`, head: `${r.name} expires ${w}. renew or let it go.`,
        msg: `this expires on ${date}. renew if you want to keep it, or let it go.` };
    default:
      return { subject: `⏰ ${r.name} renews ${w}`, head: `${r.name} wants ${p} ${w} 👀`,
        msg: `this renews automatically on ${date}. still using it? do nothing. if not, cancel before then.` };
  }
}

const portalOf = (r: Due) => (r.portal_url && /^https?:\/\//i.test(r.portal_url) ? r.portal_url : null);

export function renderEmail(r: Due, unsubUrl: string) {
  const { subject, head, msg } = copy(r);
  const portal = portalOf(r);
  const color = /^#[0-9a-f]{3,8}$/i.test(r.color ?? '') ? r.color : '#FFFFFF';
  const rows: [string, string][] = [
    ['date', fmt(r.due_date)], ['amount', money(r.price, r.currency)],
    ['type', TYPES[r.type] ?? r.type], ['cycle', CYCLES[r.billing_cycle] ?? r.billing_cycle ?? ''],
  ];
  const rowHtml = rows.map(([k, v]) =>
    `<tr><td style="padding:10px 0;border-top:2px dashed #D0D0D0;font-family:${MONO};font-size:12px;color:#141414">${esc(k)}</td>` +
    `<td align="right" style="padding:10px 0;border-top:2px dashed #D0D0D0;font-family:${SANS};font-size:14px;font-weight:800;color:#141414">${esc(v)}</td></tr>`
  ).join('');
  const cta = portal
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px"><tr><td align="center" style="background:#141414;border:2.5px solid #141414;border-radius:16px;box-shadow:4px 4px 0 #FF7AC6">` +
      `<a href="${esc(portal)}" style="display:block;padding:16px 12px;font-family:${SANS};font-size:15px;font-weight:800;color:#C6F432;text-decoration:none">manage at ${esc(portal.replace(/^https?:\/\//i, '').replace(/\/$/, ''))} ↗</a></td></tr></table>`
    : '';
  const name = esc(r.name);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${FONTS}<title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#F4F0E6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F0E6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border:2.5px solid #141414;border-radius:22px;box-shadow:5px 5px 0 #141414;border-collapse:separate;overflow:hidden;color:#141414;font-family:${SANS}">
<tr><td style="background:#C6F432;border-bottom:2.5px solid #141414;padding:12px 18px;border-radius:20px 20px 0 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-family:${SANS};font-size:17px;font-weight:800;color:#141414"><span style="display:inline-block;width:26px;height:26px;line-height:26px;border-radius:8px;background:#141414;color:#C6F432;text-align:center;font-size:15px;vertical-align:middle">P</span>&nbsp; <span style="vertical-align:middle">Pingo</span></td>
<td align="right" style="font-family:${MONO};font-size:11px;color:#141414">REMINDER</td>
</tr></table></td></tr>
<tr><td style="padding:22px 18px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td width="52" style="width:52px;height:52px;border-radius:50%;background:${color};border:2.5px solid #141414;text-align:center;vertical-align:middle;font-family:${SANS};font-size:24px;font-weight:800;color:#141414">${esc((r.name.trim()[0] ?? '?').toUpperCase())}</td>
<td style="padding-left:12px"><div style="font-family:${SANS};font-size:20px;font-weight:800;color:#141414">${name}</div><div style="font-family:${MONO};font-size:13px;color:#141414">${esc(money(r.price, r.currency) + (CYC[r.billing_cycle] ?? ''))}</div></td>
</tr></table>
<div style="margin-top:18px;font-family:${SANS};font-size:26px;line-height:1.1;letter-spacing:-.8px;font-weight:800;color:#141414">${esc(head)}</div>
<p style="margin:12px 0 0;font-family:${SANS};font-size:15px;line-height:1.45;font-weight:500;color:#141414">${esc(msg)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">${rowHtml}</table>
${cta}
</td></tr>
<tr><td style="padding:16px 18px;background:#FFF8EC;border-top:2.5px solid #141414;border-radius:0 0 20px 20px;font-family:${MONO};font-size:12px;line-height:1.5;color:#141414">
<div>you’re getting this because email reminders are on for ${name}.</div>
<div style="margin-top:8px"><a href="${esc(unsubUrl)}" style="color:#141414;text-decoration:underline">unsubscribe from ${name} emails</a></div>
<div style="margin-top:10px">Pingo · sent with ♥</div>
</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${head}\n\n${msg}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n` +
    (portal ? `\nmanage: ${portal}\n` : '') +
    `\n--\nyou’re getting this because email reminders are on for ${r.name}.\nunsubscribe: ${unsubUrl}\n`;
  return { subject, html, text };
}

async function send(r: Due) {
  const unsub = `${SELF_URL}?unsub=${r.subscription_id}&sig=${await sign(r.subscription_id)}`;
  const { subject, html, text } = renderEmail(r, unsub);
  await smtp().sendMail({
    from: Deno.env.get('EMAIL_FROM') ?? `Pingo <${env('SMTP_USER')}>`,
    to: r.email,
    subject,
    html,
    text,
    headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  });
}

// Landing page for unsub (undo = null → show the "oops, undo" form) or resub (undo = null, done = true).
export function renderPage(name: string, resubscribed: boolean, undoAction: string | null) {
  const n = esc(name);
  const title = resubscribed ? 'you’re back in' : 'you’re unsubscribed';
  const body = resubscribed
    ? `emails about ${n} are back on. we’ll write before it charges.`
    : `no more emails about ${n}. push reminders in the app still work.`;
  const btn = `display:block;width:100%;height:56px;border:2.5px solid #141414;border-radius:18px;background:#141414;color:#C6F432;font-family:${SANS};font-size:17px;font-weight:800;box-shadow:4px 4px 0 #FF7AC6`;
  const action = resubscribed || !undoAction
    ? `<button type="button" disabled style="${btn};opacity:.55;box-shadow:none;cursor:default">resubscribed ✓</button>`
    : `<form method="post" action="${esc(undoAction)}" style="margin:0"><button type="submit" style="${btn};cursor:pointer">oops, undo</button></form>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">${FONTS}<title>${esc(title)} · Pingo</title></head>
<body style="margin:0;min-height:100vh;background:#FFF8EC;color:#141414;font-family:${SANS};display:flex;align-items:center;justify-content:center">
<main style="width:100%;max-width:420px;padding:24px 28px;box-sizing:border-box">
<div style="width:110px;height:110px;border-radius:50%;background:#C6F432;border:3px solid #141414;box-shadow:6px 6px 0 #141414;display:flex;align-items:center;justify-content:center;font-size:58px;font-weight:800;transform:rotate(-8deg)">✓</div>
<h1 style="margin:28px 0 0;font-size:40px;line-height:1;letter-spacing:-1.5px;font-weight:800">${title}</h1>
<p style="margin:12px 0 0;font-size:17px;line-height:1.4;font-weight:500">${body}</p>
<div style="margin-top:28px">${action}</div>
<div style="margin-top:22px;font-family:${MONO};font-size:12px;line-height:1.5">other subs keep emailing as usual. manage them all in settings.</div>
</main></body></html>`;
}

async function toggle(req: Request, url: URL, param: 'unsub' | 'resub') {
  // Resub only via POST (the undo form), so link prefetchers/scanners can't flip it back on.
  if (param === 'resub' && req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
  const id = url.searchParams.get(param) ?? '';
  const sig = url.searchParams.get('sig') ?? '';
  if (!/^[0-9a-f-]{36}$/.test(id) || sig !== (await sign(id))) {
    return new Response('Invalid link', { status: 400 });
  }
  const resub = param === 'resub';
  const { data, error } = await db.from('subscriptions').update({ email_enabled: resub }).eq('id', id).select('name').maybeSingle();
  if (error) return new Response('Something went wrong, try again later.', { status: 500 });
  if (!data) return new Response('This subscription no longer exists, so there is nothing to unsubscribe from.', { status: 404 });
  if (!PUBLIC_URL) return new Response(plainPage(data.name, resub), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const html = renderPage(data.name, resub, resub ? null : `?resub=${id}&sig=${encodeURIComponent(sig)}`);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export const plainPage = (name: string, resubscribed: boolean) => resubscribed
  ? `Pingo ✓ you're back in.\n\nEmails about ${name} are back on. We'll write before it charges.`
  : `Pingo ✓ you're unsubscribed.\n\nNo more emails about ${name}. Push reminders in the app still work.\n\nChanged your mind? Open Pingo → ${name} → edit → turn on "email me too".\nOther subs keep emailing as usual.`;

if (import.meta.main) Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.has('unsub')) return toggle(req, url, 'unsub');
  if (url.searchParams.has('resub')) return toggle(req, url, 'resub');
  if (req.method !== 'POST' || req.headers.get('x-cron-secret') !== SECRET) return new Response('Forbidden', { status: 403 });

  const { data, error } = await db.rpc('claim_email_reminders');
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  const failed: string[] = [];
  for (const r of data as Due[]) {
    try {
      await send(r);
      sent++;
    } catch (e) {
      failed.push(`${r.subscription_id}: ${(e as Error).message}`);
      // Release the claim so the next run retries.
      await db.from('notification_log').delete()
        .match({ subscription_id: r.subscription_id, due_date: r.due_date, days_before: r.days_before, channel: 'email' });
    }
  }
  if (failed.length) console.error('send failures', failed);
  return Response.json({ sent, failed: failed.length });
});
