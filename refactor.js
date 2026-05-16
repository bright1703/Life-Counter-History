#!/usr/bin/env node
/**
 * Step 1: Extract <style> → styles.css and main <script> → app.js
 * Updates index.html to reference the external files.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// ── Extract CSS ──────────────────────────────────────────────────────────────
const styleStart = html.indexOf('<style>');
const styleEnd   = html.indexOf('</style>') + '</style>'.length;
if (styleStart === -1) { console.error('ERROR: <style> not found'); process.exit(1); }

const cssContent = html.slice(styleStart + '<style>'.length, styleEnd - '</style>'.length);
fs.writeFileSync(path.join(__dirname, 'styles.css'), cssContent.trimStart(), 'utf8');
console.log(`styles.css written (${(cssContent.length / 1024).toFixed(1)} KB)`);

// Replace the <style>...</style> block with external link
html = html.slice(0, styleStart)
  + '<link rel="stylesheet" href="/styles.css"/>'
  + html.slice(styleEnd);

// ── Extract main JS ──────────────────────────────────────────────────────────
// The main script is the LAST <script>...</script> pair in the file
// (after <script src="data.js"></script>)
const dataJsTag = '<script src="data.js"></script>';
const afterDataJs = html.indexOf(dataJsTag) + dataJsTag.length;
if (afterDataJs === dataJsTag.length - 1) {
  console.error('ERROR: data.js script tag not found'); process.exit(1);
}

const mainScriptStart = html.indexOf('<script>', afterDataJs);
const mainScriptEnd   = html.lastIndexOf('</script>') + '</script>'.length;
if (mainScriptStart === -1) { console.error('ERROR: main <script> not found'); process.exit(1); }

const jsContent = html.slice(mainScriptStart + '<script>'.length, mainScriptEnd - '</script>'.length);
fs.writeFileSync(path.join(__dirname, 'app.js'), jsContent.trimStart(), 'utf8');
console.log(`app.js written (${(jsContent.length / 1024).toFixed(1)} KB)`);

// Replace the main <script>...</script> block with external reference
html = html.slice(0, mainScriptStart)
  + '<script src="/app.js"></script>'
  + html.slice(mainScriptEnd);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('index.html updated');
