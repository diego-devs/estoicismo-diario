#!/usr/bin/env node
/**
 * Process subscription requests from Gmail inbox.
 * Looks for emails with subject containing "SUSCRIBIR" or "CANCELAR".
 */

const { ImapFlow } = require('imapflow');
const fs = require('fs');
const path = require('path');

const CREDS_PATH = path.join(__dirname, '..', '..', '.credentials', 'gmail.json');
const SUBSCRIBERS_PATH = path.join(__dirname, '..', 'subscribers', 'list.json');

async function main() {
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const data = JSON.parse(fs.readFileSync(SUBSCRIBERS_PATH, 'utf8'));

  const client = new ImapFlow({
    host: creds.imap.host,
    port: creds.imap.port,
    secure: creds.imap.secure,
    auth: { user: creds.email, pass: creds.appPassword },
    logger: false
  });

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  let changes = 0;

  try {
    // Search unseen messages
    const unseen = await client.search({ seen: false });
    
    for (const uid of unseen) {
      const msg = await client.fetchOne(uid, { envelope: true });
      const subject = (msg.envelope.subject || '').toUpperCase().trim();
      const fromAddr = msg.envelope.from?.[0]?.address?.toLowerCase();

      if (!fromAddr) continue;

      if (subject.includes('SUSCRIBIR') || subject.includes('SUBSCRIBE')) {
        const exists = data.subscribers.find(s => s.email === fromAddr);
        if (!exists) {
          data.subscribers.push({
            email: fromAddr,
            active: true,
            subscribedAt: new Date().toISOString()
          });
          console.log(`+ Subscribed: ${fromAddr}`);
          changes++;
        } else if (!exists.active) {
          exists.active = true;
          console.log(`+ Re-activated: ${fromAddr}`);
          changes++;
        } else {
          console.log(`= Already subscribed: ${fromAddr}`);
        }
        await client.messageFlagsAdd(uid, ['\\Seen']);
      }
      else if (subject.includes('CANCELAR') || subject.includes('UNSUBSCRIBE')) {
        const exists = data.subscribers.find(s => s.email === fromAddr);
        if (exists) {
          exists.active = false;
          exists.unsubscribedAt = new Date().toISOString();
          console.log(`- Unsubscribed: ${fromAddr}`);
          changes++;
        }
        await client.messageFlagsAdd(uid, ['\\Seen']);
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }

  if (changes > 0) {
    fs.writeFileSync(SUBSCRIBERS_PATH, JSON.stringify(data, null, 2) + '\n');
    console.log(`\nSaved ${data.subscribers.filter(s => s.active).length} active subscribers.`);
  } else {
    console.log('No subscription changes.');
  }

  return changes;
}

main().catch(err => { console.error(err); process.exit(1); });
