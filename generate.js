#!/usr/bin/env node
/**
 * Generate 366 static pages under /born/{month}-{day}/index.html
 * and update sitemap.xml with all URLs.
 *
 * Run: node generate.js
 * Re-run after every update to index.html, styles.css or app.js.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;

const MONTHS = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december'
];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// Ordinal suffix: 1→1st, 2→2nd, etc.
function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const template = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Fix relative data.js → root-relative /data.js for subdir pages
const TMPL = template.replace(
  '<script src="data.js"></script>',
  '<script src="/data.js"></script>'
);

const bornDir = path.join(ROOT, 'born');
if (!fs.existsSync(bornDir)) fs.mkdirSync(bornDir);

const sitemapUrls = [
  `  <url>\n    <loc>https://bornhistory.com/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n    <lastmod>2026-05-16</lastmod>\n  </url>`
];

let count = 0;

// Use year 2000 (leap year) to cover all 366 days including Feb 29
for (let month = 1; month <= 12; month++) {
  const daysInMonth = new Date(2000, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const monthSlug = MONTHS[month - 1];
    const slug      = `${monthSlug}-${day}`;
    const monthName = MONTH_NAMES[month - 1];
    const dayStr    = ordinal(day);
    const canonical = `https://bornhistory.com/born/${slug}/`;

    // Default pre-fill date for the form
    // Use 2000 (leap year) so Feb 29 is valid; 1990 for all other days
    const mm          = String(month).padStart(2, '0');
    const dd          = String(day).padStart(2, '0');
    const defaultYear = (month === 2 && day === 29) ? 2000 : 1990;
    const defaultDob  = `${defaultYear}-${mm}-${dd}`;

    const title = `Famous People Born on ${monthName} ${dayStr} | Birthday History & Life Stats | BornHistory`;
    const desc  = `Who was born on ${monthName} ${dayStr}? Discover famous people born on this day, `
                + `historical events, life stats, and birthday facts. `
                + `Enter your birth year for personalized results. Free, 11 languages.`;

    const introText =
      `<strong>BornHistory</strong> — discover who was born on <em>${monthName} ${dayStr}</em>. `
    + `Enter your birth year below to see <em>famous people born on ${monthName} ${dayStr}</em>, `
    + `<em>historical events</em> from that exact day, your personal <em>life stats</em> `
    + `(days lived, heartbeats, hours slept), historical prices from your birth year, `
    + `and a Bitcoin what-if calculator. <em>Birthday history</em> made personal — `
    + `free and available in 11 languages.`;

    let html = TMPL;

    // title
    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${title}</title>`
    );

    // meta description
    html = html.replace(
      /<meta name="description" content="[^"]*"\/>/,
      `<meta name="description" content="${desc}"/>`
    );

    // canonical
    html = html.replace(
      /<link rel="canonical" href="[^"]*"\/>/,
      `<link rel="canonical" href="${canonical}"/>`
    );

    // og:title
    html = html.replace(
      /<meta property="og:title" content="[^"]*"\/>/,
      `<meta property="og:title" content="Famous People Born on ${monthName} ${dayStr} | BornHistory"/>`
    );

    // og:url
    html = html.replace(
      /<meta property="og:url" content="[^"]*"\/>/,
      `<meta property="og:url" content="${canonical}"/>`
    );

    // hreflang: update all href values to this page's canonical
    html = html.replace(
      /(<link rel="alternate" hreflang="[^"]*" href=")[^"]*("\/?>)/g,
      `$1${canonical}$2`
    );

    // JSON-LD: update url field
    html = html.replace(
      /"url": "https:\/\/bornhistory\.com\/"/,
      `"url": "${canonical}"`
    );

    // SEO intro section: replace with day-specific text
    html = html.replace(
      /<!-- ═══ SEO: Descriptive intro block ═══ -->[\s\S]*?<\/section>/,
      `<!-- ═══ SEO: Descriptive intro block ═══ -->\n<section class="seo-intro" aria-label="About BornHistory"><p>${introText}</p></section>`
    );

    // Pre-fill the date input on page load
    const prefillScript =
      `<script>document.addEventListener('DOMContentLoaded',function(){`
    + `var d=document.getElementById('dob');if(d&&!d.value)d.value='${defaultDob}';`
    + `});</script>`;

    html = html.replace('</body>', prefillScript + '\n</body>');

    // Write file
    const dirPath = path.join(bornDir, slug);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, 'index.html'), html, 'utf8');

    sitemapUrls.push(
      `  <url>\n    <loc>${canonical}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n    <lastmod>2026-05-16</lastmod>\n  </url>`
    );
    count++;
  }
}

// Write sitemap.xml
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n`
+ `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
+ sitemapUrls.join('\n')
+ `\n</urlset>\n`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

console.log(`✓ Generated ${count} pages in /born/`);
console.log(`✓ sitemap.xml updated (${sitemapUrls.length} URLs)`);
console.log(`✓ Sample: born/january-1/index.html`);
