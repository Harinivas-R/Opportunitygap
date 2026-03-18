const fs = require('fs');
let html = fs.readFileSync('e:/Antigravity project/index.html', 'utf8');

// Replace tailwind prefixes inside classes
html = html.replace(/\bsm:/g, 'mobile:');
html = html.replace(/\bmd:/g, 'tablet:');
html = html.replace(/\blg:/g, 'laptop:');
html = html.replace(/\bxl:/g, 'desktop:');

// Inject the screen sizes in tailwind.config
const configReplacement = `        tailwind.config = {
            theme: {
                screens: {
                    'mobile': '480px',
                    'tablet': '768px',
                    'laptop': '1024px',
                    'desktop': '1280px',
                },
                extend: {`;
                
html = html.replace(/        tailwind.config = {\n            theme: {\n                extend: {/, configReplacement);

fs.writeFileSync('e:/Antigravity project/index.html', html);
console.log('Done mapping breakpoints to mobile, tablet, laptop, desktop');
