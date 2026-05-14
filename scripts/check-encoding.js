#!/usr/bin/env node

/**
 * Script to check and fix file encoding issues
 * Usage: node scripts/check-encoding.js [fix]
 */

const fs = require('fs');
const path = require('path');

// Files to check (recursive in src/)
const CHECK_DIRS = ['src'];
const EXCLUDE_PATTERNS = ['node_modules', '.git', 'android', 'ios', 'build'];
const FILE_PATTERNS = ['.ts', '.tsx', '.js', '.jsx'];

function hasBOM(buffer) {
  // UTF-8 BOM is EF BB BF
  return buffer.length >= 3 && 
         buffer[0] === 0xEF && 
         buffer[1] === 0xBB && 
         buffer[2] === 0xBF;
}

function checkFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const hasBOMMarker = hasBOM(buffer);
    const content = hasBOMMarker ? buffer.toString('utf8', 3) : buffer.toString('utf8');
    
    // Check for common encoding issues
    const issues = [];
    
    if (hasBOMMarker) {
      issues.push('Has UTF-8 BOM');
    }
    
    // Check for common Vietnamese encoding issues
    const vietnamesePatterns = [
      /[\u00C0-\u017F]{2,}/, // Vietnamese diacritics
    ];
    
    vietnamesePatterns.forEach((pattern, i) => {
      if (pattern.test(content)) {
        // This is actually good - means Vietnamese text is present
        // issues.push('Contains Vietnamese text');
      }
    });
    
    return {
      path: filePath,
      hasBOM: hasBOMMarker,
      issues,
      size: buffer.length,
    };
  } catch (error) {
    return {
      path: filePath,
      error: error.message,
    };
  }
}

function walkDir(dirPath) {
  const results = [];
  
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip excluded directories
        if (!EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern))) {
          results.push(...walkDir(filePath));
        }
      } else if (FILE_PATTERNS.some(ext => file.endsWith(ext))) {
        results.push(checkFile(filePath));
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
  
  return results;
}

function fixFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const hasBOMMarker = hasBOM(buffer);
    
    if (hasBOMMarker) {
      // Remove BOM and rewrite
      const content = buffer.toString('utf8', 3);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed BOM in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main
const args = process.argv.slice(2);
const shouldFix = args.includes('fix');

console.log('Checking file encoding...\n');

const results = CHECK_DIRS.flatMap(dir => walkDir(path.join(process.cwd(), dir)));

const issues = results.filter(r => r.issues && r.issues.length > 0);
const errors = results.filter(r => r.error);

if (errors.length > 0) {
  console.log('Errors:');
  errors.forEach(r => console.log(`  ✗ ${r.path}: ${r.error}`));
  console.log('');
}

if (issues.length === 0) {
  console.log('✓ No encoding issues found!');
} else {
  console.log(`Found ${issues.length} file(s) with issues:`);
  issues.forEach(r => {
    console.log(`  ${r.hasBOM ? '⚠' : '?'} ${r.path}`);
    r.issues.forEach(issue => console.log(`    - ${issue}`));
    
    if (shouldFix && r.hasBOM) {
      fixFile(r.path);
    }
  });
}

console.log(`\nTotal files checked: ${results.length}`);
if (shouldFix && issues.some(r => r.hasBOM)) {
  console.log('Fix operation completed.');
}
