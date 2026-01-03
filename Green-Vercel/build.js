const fs = require('fs-extra');
const { execSync } = require('child_process');
const path = require('path');

const DIST_DIR = 'dist';
const args = process.argv.slice(2);
const isMinify = args.includes('--minify');
const isObfuscate = args.includes('--obfuscate') || !isMinify; // Default to obfuscate

console.log('========================================');
console.log('  Building Production Version');
console.log(`  Mode: ${isObfuscate ? 'OBFUSCATE' : 'MINIFY'}`);
console.log('========================================\n');

// Step 1: Clean dist folder
console.log('[CLEAN] Removing old dist folder...');
if (fs.existsSync(DIST_DIR)) {
    fs.removeSync(DIST_DIR);
}

// Step 2: Create dist structure
console.log('[CREATE] Creating dist folder structure...');
fs.mkdirSync(`${DIST_DIR}/public/js`, { recursive: true });
fs.mkdirSync(`${DIST_DIR}/public/styles`, { recursive: true });
fs.mkdirSync(`${DIST_DIR}/public/meta`, { recursive: true });
fs.mkdirSync(`${DIST_DIR}/public/fonts`, { recursive: true });

// Step 3: Process JavaScript files
console.log('\n========================================');
console.log('  Processing JavaScript Files');
console.log('========================================\n');

const jsFiles = ['config.js', 'utils.js', 'modal.js', 'app.js'];
jsFiles.forEach((file, index) => {
    console.log(`[${index + 1}/${jsFiles.length}] Processing ${file}...`);
    const inputPath = `public/js/${file}`;
    const outputPath = `${DIST_DIR}/public/js/${file}`;
    
    try {
        if (isObfuscate) {
            execSync(`javascript-obfuscator ${inputPath} --output ${outputPath} --compact true --control-flow-flattening true --dead-code-injection true --string-array true --string-array-encoding base64 --unicode-escape-sequence true`, {
                stdio: 'inherit'
            });
        } else {
            execSync(`terser ${inputPath} -o ${outputPath} -c -m`, {
                stdio: 'inherit'
            });
        }
    } catch (error) {
        console.error(`Error processing ${file}:`, error.message);
    }
});

// Step 4: Copy CSS files
console.log('\n========================================');
console.log('  Copying CSS Files');
console.log('========================================\n');
console.log('[CSS] Copying styles...');
fs.copySync('public/styles', `${DIST_DIR}/public/styles`);

// Step 5: Copy assets
console.log('\n========================================');
console.log('  Copying Assets');
console.log('========================================\n');

console.log('[ASSETS] Copying images and files...');
const publicFiles = fs.readdirSync('public');
publicFiles.forEach(file => {
    const filePath = path.join('public', file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.txt', '.ico', '.woff2'].includes(ext)) {
            fs.copySync(filePath, path.join(DIST_DIR, 'public', file));
        }
    }
});

console.log('[META] Copying meta folder...');
if (fs.existsSync('public/meta')) {
    fs.copySync('public/meta', `${DIST_DIR}/public/meta`);
}

console.log('[FONTS] Copying fonts folder...');
if (fs.existsSync('public/fonts')) {
    fs.copySync('public/fonts', `${DIST_DIR}/public/fonts`);
}

// Step 6: Copy HTML files
console.log('\n========================================');
console.log('  Copying HTML Files');
console.log('========================================\n');

console.log('[HTML] Copying HTML files...');
if (fs.existsSync('required.html')) {
    fs.copySync('required.html', `${DIST_DIR}/required.html`);
}
if (fs.existsSync('index.html')) {
    fs.copySync('index.html', `${DIST_DIR}/index.html`);
}

// Step 7: Copy Vercel config for dist deployment
console.log('\n[VERCEL] Copying Vercel config...');
if (fs.existsSync('dist-vercel.json')) {
    fs.copySync('dist-vercel.json', `${DIST_DIR}/vercel.json`);
}

// Step 8: Create deployment info
const deployInfo = {
    buildDate: new Date().toISOString(),
    buildType: isObfuscate ? 'obfuscate' : 'minify',
    version: require('./package.json').version
};

fs.writeFileSync(
    `${DIST_DIR}/build-info.json`,
    JSON.stringify(deployInfo, null, 2)
);

console.log('\n========================================');
console.log('  Build Complete!');
console.log('========================================\n');
console.log('Production files are ready in: dist/\n');
console.log('Folder structure:');
console.log('  dist/');
console.log('  ├── required.html');
console.log('  ├── robot.html');
console.log('  ├── build-info.json');
console.log('  └── public/');
console.log('      ├── js/ (processed)');
console.log('      ├── styles/');
console.log('      ├── meta/');
console.log('      ├── fonts/');
console.log('      └── assets\n');
console.log('You can now deploy the "dist" folder!\n');

