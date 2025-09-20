// Simple test to verify the bot structure
console.log('Testing Discord Bot structure...');

// Test 1: Check if main files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'index.js',
    'server.js',
    'package.json',
    '.env.example',
    'src/commands/ping.js',
    'public/index.html',
    'public/script.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✓ ${file} exists`);
    } else {
        console.log(`✗ ${file} missing`);
        allFilesExist = false;
    }
});

// Test 2: Check package.json dependencies
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['discord.js', 'express', 'dotenv'];
    
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
            console.log(`✓ ${dep} dependency found`);
        } else {
            console.log(`✗ ${dep} dependency missing`);
            allFilesExist = false;
        }
    });
} catch (error) {
    console.log('✗ Error reading package.json:', error.message);
    allFilesExist = false;
}

// Test 3: Check if index.js can be required (basic syntax check)
try {
    console.log('✓ Checking index.js syntax...');
    require('./index.js');
    console.log('✓ index.js syntax looks good');
} catch (error) {
    if (error.message.includes('TOKEN')) {
        console.log('✓ index.js syntax is valid (expected token error)');
    } else {
        console.log('✗ index.js syntax error:', error.message);
        allFilesExist = false;
    }
}

console.log('\nTest completed:', allFilesExist ? 'PASSED' : 'FAILED');
process.exit(allFilesExist ? 0 : 1);