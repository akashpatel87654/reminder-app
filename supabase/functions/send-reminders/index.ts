// Hourly-ish (cron → POST with x-cron-secret): email every due reminder.
// Public GET/POST ?unsub=<id>&sig=<hmac>: one-click unsubscribe for that subscription.
import { createClient } from 'npm:@supabase/supabase-js@2';

const env = (k: string) => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`missing env ${k}`);
  return v;
};
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
const SECRET = env('CRON_SECRET');
const SELF_URL = `${env('SUPABASE_URL')}/functions/v1/send-reminders`;

type Due = {
  subscription_id: string; due_date: string; days_before: number; days_left: number; email: string;
  name: string; price: number; currency: string; type: 'auto_renew' | 'expires' | 'free_trial'; portal_url: string | null;
};

async function sign(id: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id));
  return btoa(String.fromCharCode(...new Uint8Array(mac))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]!);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const money = (n: number, cur: string) => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur }).format(n);
  } catch {
    return `${cur} ${Number(n).toFixed(2)}`;
  }
};
const when = (d: number) => (d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`);

// Same wording as the app's local notification (src/lib/reminders.ts).
function text(r: Due) {
  const price = money(r.price, r.currency);
  switch (r.type) {
    case 'auto_renew':
      return { subject: `${r.name} renews ${when(r.days_left)}`, body: `${price} will be charged on ${r.due_date}. Cancel before then if you don't need it.` };
    case 'free_trial':
      return { subject: `${r.name} trial ends ${when(r.days_left)}`, body: `${price} will be charged on ${r.due_date} unless you cancel.` };
    case 'expires':
      return { subject: `${r.name} expires ${when(r.days_left)}`, body: `Renew before ${r.due_date} to keep access.` };
  }
}

async function send(r: Due) {
  const { subject, body } = text(r);
  const unsub = `${SELF_URL}?unsub=${r.subscription_id}&sig=${await sign(r.subscription_id)}`;
  const portal = r.portal_url && /^https?:\/\//.test(r.portal_url)
    ? `<p><a href="${esc(r.portal_url)}">Manage ${esc(r.name)}</a></p>` : '';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env('EMAIL_FROM'),
      to: r.email,
      subject,
      html: `<p>${esc(body)}</p>${portal}<p style="color:#888;font-size:12px"><a href="${unsub}">Stop emails for ${esc(r.name)}</a></p>`,
      headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
}

async function unsubscribe(url: URL) {
  const id = url.searchParams.get('unsub') ?? '';
  if (!/^[0-9a-f-]{36}$/.test(id) || url.searchParams.get('sig') !== (await sign(id))) {
    return new Response('Invalid link', { status: 400 });
  }
  const { error } = await db.from('subscriptions').update({ email_enabled: false }).eq('id', id);
  if (error) return new Response('Something went wrong, try again later', { status: 500 });
  return new Response('<p>Done. You won\'t get more emails for this subscription.</p>', { headers: { 'Content-Type': 'text/html' } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.has('unsub')) return unsubscribe(url);
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
