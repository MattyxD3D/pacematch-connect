#!/usr/bin/env node

/**
 * Convert Source Code to PDF
 * 
 * This script reads all source code files and converts them to a PDF document
 * that can be processed by AI PDF tools or presentation builders.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to use pdfkit, if not available, we'll install it
let PDFDocument;
try {
  const pdfkit = await import('pdfkit');
  PDFDocument = pdfkit.default || pdfkit;
} catch (e) {
  console.log('📦 Installing pdfkit...');
  const { execSync } = await import('child_process');
  execSync('npm install pdfkit --save-dev --legacy-peer-deps', { stdio: 'inherit', cwd: __dirname });
  const pdfkit = await import('pdfkit');
  PDFDocument = pdfkit.default || pdfkit;
}

// File extensions to include (main source code only)
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css'];
// Essential config files to include from root
const ROOT_CONFIG_FILES = ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'capacitor.config.ts', 'index.html', 'tailwind.config.ts', 'postcss.config.js', 'eslint.config.js', 'components.json'];
// Directories to exclude (native code, build artifacts, etc.)
const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', 'build', '.next', 'coverage', '.vscode', '.idea', 'android', 'ios', 'functions', 'public', 'scripts', 'node_modules'];
const EXCLUDE_FILES = ['.DS_Store', 'package-lock.json', 'bun.lockb', 'convert-to-pdf.js'];

/**
 * Check if a directory should be excluded
 */
function shouldExcludeDir(dirName) {
  return EXCLUDE_DIRS.some(exclude => dirName.includes(exclude));
}

/**
 * Check if a file should be included
 */
function shouldIncludeFile(filePath, fileName) {
  const ext = path.extname(fileName);
  const relativePath = path.relative(__dirname, filePath);
  
  // Exclude .md files (documentation)
  if (ext === '.md') {
    return false;
  }
  
  // Exclude specific files
  if (EXCLUDE_FILES.includes(fileName)) {
    return false;
  }
  
  // Include root config files
  if (ROOT_CONFIG_FILES.includes(fileName) && !relativePath.includes('/')) {
    return true;
  }
  
  // Only include files from src/ directory
  if (relativePath.startsWith('src/')) {
    return SOURCE_EXTENSIONS.includes(ext);
  }
  
  return false;
}

/**
 * Get all source files recursively
 */
function getAllSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Only process src/ directory and root level
      const relativePath = path.relative(__dirname, filePath);
      if (relativePath.startsWith('src/') || relativePath === 'src') {
        if (!shouldExcludeDir(file)) {
          getAllSourceFiles(filePath, fileList);
        }
      }
    } else {
      // Check if file should be included
      if (shouldIncludeFile(filePath, file)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Format code for PDF (basic formatting)
 */
function formatCodeForPDF(code, maxWidth = 100) {
  const lines = code.split('\n');
  const formatted = [];
  
  lines.forEach((line, index) => {
    // Truncate very long lines
    if (line.length > maxWidth) {
      formatted.push(`${(index + 1).toString().padStart(4, ' ')} | ${line.substring(0, maxWidth)}...`);
    } else {
      formatted.push(`${(index + 1).toString().padStart(4, ' ')} | ${line}`);
    }
  });
  
  return formatted.join('\n');
}

/**
 * Create PDF from source files
 */
async function createPDF() {
  console.log('📚 Scanning source files...');
  
  const projectRoot = __dirname;
  const sourceFiles = getAllSourceFiles(projectRoot);
  
  console.log(`✅ Found ${sourceFiles.length} source files`);
  console.log('📄 Creating PDF...');

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const outputPath = path.join(projectRoot, 'pacematch-source-code.pdf');
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Add title page
  doc.fontSize(24)
     .text('PaceMatch Connect', 50, 100, { align: 'center' });
  
  doc.fontSize(16)
     .text('Source Code Documentation', 50, 150, { align: 'center' });
  
  doc.fontSize(12)
     .text(`Generated: ${new Date().toLocaleString()}`, 50, 200, { align: 'center' });
  
  doc.fontSize(10)
     .text(`Total Files: ${sourceFiles.length}`, 50, 230, { align: 'center' });
  
  doc.addPage();

  // Table of contents
  doc.fontSize(18)
     .text('Table of Contents', 50, 50);
  
  doc.fontSize(10);
  let tocY = 100;
  sourceFiles.forEach((file, index) => {
    const relativePath = path.relative(projectRoot, file);
    if (tocY > 750) {
      doc.addPage();
      tocY = 50;
    }
    doc.text(`${index + 1}. ${relativePath}`, 50, tocY);
    tocY += 15;
  });

  // Add source files
  sourceFiles.forEach((file, fileIndex) => {
    console.log(`  Processing ${fileIndex + 1}/${sourceFiles.length}: ${path.relative(projectRoot, file)}`);
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(projectRoot, file);
      
      // Add new page for each file
      doc.addPage();
      
      // File header
      doc.fontSize(14)
         .fillColor('#0066cc')
         .text(`File: ${relativePath}`, 50, 50, { underline: true });
      
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Lines: ${content.split('\n').length}`, 50, 75);
      
      // Code content
      doc.fontSize(8)
         .fillColor('#000000')
         .font('Courier');
      
      const formattedCode = formatCodeForPDF(content, 120);
      const lines = formattedCode.split('\n');
      
      let y = 100;
      const lineHeight = 10;
      const maxLinesPerPage = Math.floor((750 - 100) / lineHeight);
      
      lines.forEach((line, lineIndex) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }
        
        // Truncate if too long
        if (line.length > 150) {
          doc.text(line.substring(0, 150) + '...', 50, y, { width: 500 });
        } else {
          doc.text(line, 50, y, { width: 500 });
        }
        
        y += lineHeight;
      });
      
    } catch (error) {
      console.error(`  ⚠️  Error reading ${file}: ${error.message}`);
      doc.addPage();
      doc.fontSize(12)
         .fillColor('#cc0000')
         .text(`Error reading file: ${path.relative(projectRoot, file)}`, 50, 50);
      doc.text(`Error: ${error.message}`, 50, 75);
    }
  });

  // Finalize PDF
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`\n✅ PDF created successfully!`);
      console.log(`📄 File: ${outputPath}`);
      console.log(`📊 Size: ${sizeMB} MB`);
      resolve(outputPath);
    });
    
    stream.on('error', reject);
  });
}

// Run the script
createPDF().catch(error => {
  console.error('❌ Error creating PDF:', error);
  process.exit(1);
});

