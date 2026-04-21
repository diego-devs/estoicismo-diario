const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(!/\.article-card\.expanded \.article-content \{\s*max-height:\s*800px;/m.test(html), 'Expanded article content should not be capped at 800px.');
assert(/\.article-content\s*\{[\s\S]*max-height:\s*0;[\s\S]*overflow:\s*hidden;/m.test(html), 'Collapsed article content should remain hidden by default.');
assert(/card\.style\.setProperty\('\--article-content-height', `\$\{contentDiv\.scrollHeight\}px`\)/m.test(html), 'toggleArticle should set dynamic article content height using scrollHeight.');
assert(/\.article-card\.expanded \.article-content \{[\s\S]*max-height:\s*var\(--article-content-height, 0px\);/m.test(html), 'Expanded article content should use dynamic CSS variable height.');

console.log('article layout test passed');
