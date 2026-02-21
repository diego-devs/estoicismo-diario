#!/usr/bin/env node
/**
 * Estoicismo Diario — Newsletter Sender
 * Sends the latest article to all subscribers via Gmail SMTP.
 * Usage: node send-newsletter.js [YYYY-MM-DD]
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const CREDS_PATH = path.join(__dirname, '..', '..', '.credentials', 'gmail.json');
const SUBSCRIBERS_PATH = path.join(__dirname, '..', 'subscribers', 'list.json');
const ARTICLES_DIR = path.join(__dirname, '..', 'articles');
const SITE_URL = 'https://diego-devs.github.io/estoicismo-diario';

async function main() {
  // Load credentials
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));

  // Load subscribers
  const { subscribers } = JSON.parse(fs.readFileSync(SUBSCRIBERS_PATH, 'utf8'));
  const active = subscribers.filter(s => s.active !== false);

  if (active.length === 0) {
    console.log('No active subscribers. Skipping.');
    return;
  }

  // Determine article date
  const date = process.argv[2] || new Date().toISOString().split('T')[0];
  const articlePath = path.join(ARTICLES_DIR, `${date}.json`);

  if (!fs.existsSync(articlePath)) {
    console.error(`Article not found: ${articlePath}`);
    process.exit(1);
  }

  const article = JSON.parse(fs.readFileSync(articlePath, 'utf8'));

  // Build email HTML
  const html = buildEmailHTML(article, date);
  const textVersion = buildEmailText(article, date);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: creds.smtp.host,
    port: creds.smtp.port,
    secure: creds.smtp.secure,
    auth: { user: creds.email, pass: creds.appPassword }
  });

  // Send to each subscriber
  let sent = 0, failed = 0;
  for (const sub of active) {
    try {
      await transporter.sendMail({
        from: `"Estoicismo Diario" <${creds.email}>`,
        to: sub.email,
        subject: `🏛️ ${article.title} — ${article.author}`,
        html: html.replace('{{UNSUB_EMAIL}}', sub.email),
        text: textVersion
      });
      sent++;
      console.log(`✓ Sent to ${sub.email}`);
    } catch (err) {
      failed++;
      console.error(`✗ Failed ${sub.email}: ${err.message}`);
    }
    // Rate limit: 1 per second
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed, ${active.length} total subscribers.`);
}

function buildEmailHTML(article, date) {
  const MONTHS = {
    '01':'Enero','02':'Febrero','03':'Marzo','04':'Abril','05':'Mayo','06':'Junio',
    '07':'Julio','08':'Agosto','09':'Septiembre','10':'Octubre','11':'Noviembre','12':'Diciembre'
  };
  const [y, m, d] = date.split('-');
  const dateStr = `${parseInt(d)} de ${MONTHS[m]}, ${y}`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;background:#111113;border:1px solid #222228;">
    <!-- Header -->
    <div style="padding:2rem;text-align:center;border-bottom:1px solid #222228;">
      <p style="font-size:0.7rem;letter-spacing:0.25em;text-transform:uppercase;color:#c9a96e;margin:0 0 0.5rem;">Estoicismo Diario</p>
      <h1 style="font-size:1.6rem;font-weight:400;color:#e8e6e3;margin:0 0 0.5rem;">${article.title}</h1>
      <p style="font-size:0.85rem;color:#9a9a9a;margin:0;">${dateStr} · ${article.author}</p>
    </div>

    <!-- Quote -->
    <div style="padding:1.5rem 2rem;">
      <div style="border-left:3px solid #c9a96e;padding:1.25rem 1.5rem;background:#1a1a1f;border-radius:4px;">
        <p style="font-style:italic;font-size:1.1rem;line-height:1.7;color:#e8e6e3;margin:0 0 0.75rem;">"${typeof article.quote === 'object' ? article.quote.text : article.quote}"</p>
        <p style="font-size:0.8rem;color:#c9a96e;margin:0;">— ${article.author}</p>
        <p style="font-size:0.75rem;color:#5a5a5a;font-style:italic;margin:0.25rem 0 0;">${typeof article.quote === 'object' ? article.quote.source : (article.source || '')}</p>
      </div>
    </div>

    <!-- Reflection -->
    <div style="padding:0 2rem 2rem;">
      <p style="font-size:0.95rem;line-height:1.8;color:#9a9a9a;">${article.reflection}</p>
    </div>

    <!-- Tags -->
    ${article.tags ? `<div style="padding:0 2rem 1.5rem;">
      ${article.tags.map(t => `<span style="display:inline-block;font-size:0.7rem;padding:0.2rem 0.6rem;background:#0a0a0b;color:#5a5a5a;border:1px solid #222228;border-radius:100px;margin:0 0.25rem 0.25rem 0;">#${t}</span>`).join('')}
    </div>` : ''}

    <!-- CTA -->
    <div style="padding:1.5rem 2rem;text-align:center;border-top:1px solid #222228;">
      <a href="${SITE_URL}" style="display:inline-block;padding:0.75rem 2rem;background:#c9a96e;color:#0a0a0b;text-decoration:none;border-radius:4px;font-size:0.85rem;font-weight:600;">Ver en el sitio</a>
    </div>

    <!-- Footer -->
    <div style="padding:1.5rem 2rem;text-align:center;border-top:1px solid #222228;">
      <p style="font-size:0.75rem;color:#5a5a5a;margin:0;">Recibes este correo porque te suscribiste a Estoicismo Diario.</p>
      <p style="font-size:0.75rem;color:#5a5a5a;margin:0.5rem 0 0;">Para cancelar tu suscripción, responde con asunto "CANCELAR".</p>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailText(article, date) {
  const quoteText = typeof article.quote === 'object' ? article.quote.text : article.quote;
  const sourceText = typeof article.quote === 'object' ? article.quote.source : (article.source || '');
  return `ESTOICISMO DIARIO — ${date}\n\n${article.title}\n${article.author}\n\n"${quoteText}"\n— ${article.author} (${sourceText})\n\n${article.reflection}\n\n---\nVer en el sitio: ${SITE_URL}\nPara cancelar tu suscripción, responde con asunto "CANCELAR".`;
}

main().catch(err => { console.error(err); process.exit(1); });
