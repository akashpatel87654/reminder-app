# Generates the public legal pages in docs/ (served by GitHub Pages). Run from the repo root:
#   python3 scripts/make_legal_pages.py
# Edit the copy here, re-run, commit. Keep it in sync with PRIVACY.md and the in-app privacy screen.
EMAIL = 'heatmonks.venture@gmail.com'
UPDATED = 'October 2, 2026'
PAGES = [('privacy', 'Privacy'), ('terms', 'Terms'), ('childrens-privacy', "Children's privacy")]
CURRENT = ' aria-current="page"'


def page(slug, title, desc, body):
    nav = ''.join(f'<a href="{s}.html"{CURRENT if s == slug else ""}>{t}</a>' for s, t in PAGES)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · Pingo</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header><div class="wrap">
  <a class="brand" href="privacy.html"><span class="mark" aria-hidden="true">P</span>Pingo</a>
  <nav aria-label="Legal">{nav}</nav>
</div></header>
<main><div class="wrap">
  <div class="eyebrow">Legal</div>
  <h1>{title}</h1>
  <div class="updated">Last updated {UPDATED}</div>
{body}
</div></main>
<footer><div class="wrap">
  <div class="cols">
    <div><h3>Pingo</h3><ul><li>Subscription reminders</li><li><a href="https://play.google.com/store/apps/details?id=com.akashpatel.pingo">Get it on Google Play</a></li></ul></div>
    <div><h3>Support</h3><ul><li><a href="mailto:{EMAIL}">Contact</a></li><li><a href="privacy.html#delete">Delete my data</a></li></ul></div>
    <div><h3>Legal</h3><ul><li><a href="privacy.html">Privacy policy</a></li><li><a href="terms.html">Terms of service</a></li><li><a href="childrens-privacy.html">Children's privacy</a></li></ul></div>
  </div>
  <div class="copy">© 2026 Pingo · subscriptions, handled.</div>
</div></footer>
</body>
</html>
'''


def h2(id_, text):
    return f'<h2 id="{id_}">{text}<a class="anchor" href="#{id_}" aria-label="Link to this section">#</a></h2>'


PRIVACY = f'''
<div class="card lime">
  {h2("short", "The short version")}
  <ul>
    <li>Pingo stores your email and the subscriptions you type in — nothing else.</li>
    <li>We never ask for card numbers, bank logins or passwords, and we never read your inbox or SMS.</li>
    <li>No ads, no tracking, no selling or sharing your data.</li>
    <li>Delete your account and everything in it anytime from the app.</li>
  </ul>
</div>

{h2("who", "Who we are")}
<p>Pingo is a subscription reminder app for Android and iOS, made by an independent developer. In this policy, “Pingo”, “we” and “us” mean the app and the person who runs it. You can reach us at <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>

{h2("collect", "What we collect")}
<div class="table-scroll"><table>
  <tr><th>Data</th><th>Why</th></tr>
  <tr><td><strong>Email address</strong></td><td>To sign you in with a one-time code and to send reminder emails.</td></tr>
  <tr><td><strong>Your subscriptions</strong> — name, price, currency, type, billing cycle, purchase date, next renewal date, reminder days, colour, and any optional category, manage link or notes</td><td>To show your list, upcoming renewals and spending totals, and to remind you.</td></tr>
  <tr><td><strong>Preferences</strong> — timezone, reminder time, default reminder days, currency, email reminders on/off</td><td>So reminders arrive at the right local time with your defaults.</td></tr>
  <tr><td><strong>Reminder log</strong> — which email reminders were sent and when</td><td>So you never get the same email twice.</td></tr>
</table></div>
<p>Everything above is information you give us. Pingo does not collect your location, contacts, photos, files, device identifiers, advertising ID or usage analytics.</p>

{h2("not-collect", "What we do not collect")}
<ul>
  <li>Card numbers, bank details, UPI IDs or any payment credentials.</li>
  <li>Passwords for Netflix, Spotify or any other service.</li>
  <li>The content of your inbox, SMS or other apps — Pingo can't see them.</li>
  <li>Crash or analytics data through third-party SDKs.</li>
</ul>

{h2("sign-in", "Signing in")}
<p>Pingo has no passwords. You enter your email and we send you a 6-digit code; entering the code signs you in. The code expires after an hour and works once.</p>

{h2("why", "Why we use it")}
<ul>
  <li>To run the app: your list, totals, renewal dates and reminders.</li>
  <li>To send the reminders you ask for, by notification and (if it's on) by email.</li>
  <li>To keep your account secure and respond if you contact us.</li>
</ul>
<p>We don't use your data for advertising or profiling, and we don't send marketing email.</p>

{h2("notifications", "Notifications and emails")}
<p>App notifications are scheduled on your phone itself; we don't receive a device token. Email reminders are sent from our server when a subscription is coming up. Every reminder email has a link to stop emails for that subscription, and you can turn email reminders off entirely in Settings.</p>

{h2("share", "Who we share it with")}
<p>We don't sell or share your data. Two service providers process it on our behalf, only to run Pingo:</p>
<ul>
  <li><strong>Supabase</strong> — hosts our database and sign-in.</li>
  <li><strong>Google (Gmail)</strong> — delivers sign-in and reminder emails.</li>
</ul>
<p>We would only disclose data if the law required it.</p>

{h2("retention", "How long we keep it")}
<p>We keep your data for as long as you have an account. When you delete a subscription it's removed straight away; when you delete your account, your profile, subscriptions and reminder log are permanently deleted at the same moment. Short-lived backups held by our hosting provider are overwritten on their normal schedule.</p>

{h2("delete", "Your choices and rights")}
<ul>
  <li><strong>See and edit</strong> everything you've entered, in the app.</li>
  <li><strong>Export</strong> all your subscriptions as a CSV file: Settings → <em>export all as CSV</em>.</li>
  <li><strong>Turn off</strong> notifications (Settings or your phone's settings) and email reminders (Settings, or the link in any email).</li>
  <li><strong>Delete your account</strong> in the app: Settings → <em>delete account</em>. This permanently erases your account and all associated data immediately.</li>
  <li><strong>Can't use the app?</strong> Email <a href="mailto:{EMAIL}?subject=Delete%20my%20Pingo%20account">{EMAIL}</a> from the address you signed up with, with the subject “Delete my Pingo account”. We'll delete everything within 7 days and confirm by email.</li>
</ul>
<p>Depending on where you live (for example under India's Digital Personal Data Protection Act or the GDPR), you may have further rights to access, correct or erase your data, or to complain to a regulator. Email us and we'll help.</p>

{h2("children", "Children")}
<p>Pingo is meant for adults and is not directed at children under 13. See our <a href="childrens-privacy.html">children's privacy</a> page.</p>

{h2("security", "How we protect it")}
<ul>
  <li>All traffic between the app and our servers is encrypted (HTTPS/TLS).</li>
  <li>Database rules make sure each account can only ever read and change its own data.</li>
  <li>No passwords are stored, because there aren't any.</li>
</ul>
<p>No system is perfectly secure, but we work to keep yours safe and will tell you if something goes wrong that affects you.</p>

{h2("where", "Where your data is processed")}
<p>Your data is stored on Supabase's cloud servers and email is delivered through Google. These may be located outside your country. Both providers protect data with industry-standard safeguards.</p>

{h2("changes", "Changes to this policy")}
<p>If we change this policy we'll update the date at the top, and for important changes we'll let you know in the app.</p>

{h2("contact", "Contact us")}
<p>Questions or requests about your privacy: <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
'''

TERMS = f'''
<p>These terms are an agreement between you and Pingo for using the Pingo app and this website. By using Pingo you agree to them. If you don't agree, please don't use the app.</p>

{h2("who", "Who can use Pingo")}
<p>Pingo is meant for adults. You must be 18 or older, or the age of majority where you live, to create an account. Pingo is not directed at children under 13.</p>

{h2("account", "Your account")}
<ul>
  <li>You sign in with a one-time code sent to your email. Keep access to that email secure — anyone who can read it can sign in as you.</li>
  <li>Use an email address you own. One person per account.</li>
  <li>You're responsible for what happens in your account.</li>
</ul>

{h2("reminders", "Pingo is a reminder, not a guarantee")}
<p>Pingo helps you remember renewals, expiries and free trials using the details <strong>you</strong> enter. Please keep in mind:</p>
<ul>
  <li>Dates, prices and reminders are only as accurate as the information you add. Providers may change their prices or billing dates without Pingo knowing.</li>
  <li>Notifications and emails depend on your phone, its settings, your connection and email providers. They can be delayed, filtered as spam, or not delivered.</li>
  <li>Pingo does not cancel, pause, renew or pay for anything. Cancelling a subscription is between you and the provider.</li>
  <li>Spending totals across currencies use approximate exchange rates and are estimates.</li>
  <li>Pingo is not financial, legal or tax advice.</li>
</ul>
<p>You remain responsible for managing your subscriptions and any charges from providers.</p>

{h2("acceptable-use", "Acceptable use")}
<p>Please don't:</p>
<ul>
  <li>use Pingo for anything unlawful, or to send spam through reminder emails;</li>
  <li>try to access other people's accounts or data;</li>
  <li>copy, reverse-engineer, resell or scrape the app or service, except as the law allows;</li>
  <li>overload, probe or interfere with our servers.</li>
</ul>

{h2("price", "Price and availability")}
<p>Pingo is free, with no ads and no in-app purchases. We may add, change or remove features, and the service may occasionally be unavailable for maintenance or reasons outside our control. Parts of the app work offline and sync when you're back online.</p>

{h2("our-content", "Our content")}
<p>The Pingo app, name, logo, design and text belong to us. We give you a personal, non-transferable licence to use the app for your own subscriptions while these terms apply.</p>

{h2("your-content", "Your content")}
<p>The subscriptions and notes you add are yours. You give us permission to store and process them only to run Pingo for you, as described in our <a href="privacy.html">privacy policy</a>. Don't add anything you don't have the right to share, and please don't put passwords or card numbers in notes.</p>

{h2("ending", "Ending the agreement")}
<p>You can stop using Pingo at any time and delete your account in Settings, which permanently deletes your data. We may suspend or close accounts that break these terms or put the service or other users at risk.</p>

{h2("liability", "Disclaimers and liability")}
<p>Pingo is provided “as is” and “as available”. To the extent the law allows, we make no warranties that it will be uninterrupted, error-free or that every reminder will arrive, and we are not liable for indirect or consequential losses — including charges, fees or penalties from subscription providers — arising from your use of Pingo. Nothing in these terms limits rights you have under consumer law that can't be excluded.</p>

{h2("changes", "Changes to these terms")}
<p>We may update these terms. We'll change the date at the top and, for important changes, let you know in the app. If you keep using Pingo after a change, the new terms apply.</p>

{h2("law", "Governing law")}
<p>These terms are governed by the laws of India, and disputes will be handled by the courts of India. If you live elsewhere, you keep the protections of the consumer laws of your country.</p>

{h2("contact", "Contact us")}
<p>Questions about these terms: <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
'''

CHILDREN = f'''
<div class="card lime">
  <p style="margin:0">Pingo is built for adults managing their own subscriptions. It has no advertising, no third-party tracking, no chat and no way for users to contact each other.</p>
</div>

{h2("for", "Who Pingo is for")}
<p>Pingo is intended for people aged 18 and over. It is not directed at children, and children under 13 should not use it or create an account.</p>

{h2("collect", "What we collect from children")}
<p>We do not knowingly collect personal information from children under 13. Pingo doesn't ask for age, names, photos, location or contacts — only an email address to sign in, plus the subscriptions a user chooses to enter. If we learn that an account belongs to a child under 13, we delete it and all its data.</p>

{h2("parents", "Parents and guardians")}
<p>If you believe your child has created a Pingo account, email us at <a href="mailto:{EMAIL}?subject=Child%20account%20deletion">{EMAIL}</a> with the email address used to sign up. We'll delete the account and everything in it within 7 days and confirm by email. You can also delete the account directly in the app: Settings → <em>delete account</em>.</p>

{h2("contact", "Contact")}
<p>Questions about children's privacy: <a href="mailto:{EMAIL}">{EMAIL}</a>. Our full <a href="privacy.html">privacy policy</a> explains how Pingo handles all data.</p>
'''

if __name__ == '__main__':
    for slug, title, desc, body in [
        ('privacy', 'Privacy policy', 'How Pingo collects, uses and protects your data.', PRIVACY),
        ('terms', 'Terms of service', 'The terms for using the Pingo subscription reminder app.', TERMS),
        ('childrens-privacy', "Children's privacy", 'How Pingo handles children and their data.', CHILDREN),
    ]:
        with open(f'docs/{slug}.html', 'w') as f:
            f.write(page(slug, title, desc, body))
    with open('docs/index.html', 'w') as f:
        f.write('<!doctype html><meta charset="utf-8"><title>Pingo</title>'
                '<meta http-equiv="refresh" content="0; url=privacy.html"><a href="privacy.html">Privacy policy</a>\n')
    open('docs/.nojekyll', 'w').close()  # serve files as-is
    print('docs/: privacy.html, terms.html, childrens-privacy.html')
