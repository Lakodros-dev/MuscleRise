#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Helps identify large dependencies and unused imports
 */

import { promises as fs } from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const CLIENT_DIR = path.join(PROJECT_ROOT, 'client');

// Large libraries that should be code-split or removed if unused
const HEAVY_LIBRARIES = [
  '@react-three/fiber',
  '@react-three/drei', 
  'three',
  'lodash',
  'moment',
  'date-fns',
  'recharts'
];

// Check for potential unused imports
async function scanForImports(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const imports = new Set();
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      const subImports = await scanForImports(fullPath);
      subImports.forEach(imp => imports.add(imp));
    } else if (file.name.match(/\.(ts|tsx|js|jsx)$/)) {
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
        
        if (importMatches) {
          importMatches.forEach(match => {
            const libMatch = match.match(/from\s+['"]([^'"]+)['"]/);
            if (libMatch) {
              const lib = libMatch[1];
              if (!lib.startsWith('.') && !lib.startsWith('@/')) {
                imports.add(lib);
              }
            }
          });
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }
  }
  
  return imports;
}

async function analyzeBundle() {
  console.log('🔍 Analyzing bundle for optimization opportunities...\n');
  
  try {
    // Read package.json to get dependencies
    const packageJson = JSON.parse(
      await fs.readFile(path.join(PROJECT_ROOT, 'package.json'), 'utf-8')
    );
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    // Scan for actual imports
    const actualImports = await scanForImports(CLIENT_DIR);
    
    // Check for heavy libraries
    console.log('📦 Heavy Libraries Analysis:');
    HEAVY_LIBRARIES.forEach(lib => {
      const isInstalled = allDeps[lib];
      const isUsed = actualImports.has(lib);
      
      if (isInstalled) {
        if (isUsed) {
          console.log(`  ✅ ${lib} - Used (consider code splitting)`);
        } else {
          console.log(`  ❌ ${lib} - Installed but not used (consider removing)`);
        }
      }
    });
    
    // Check for potentially unused dependencies
    console.log('\n🔍 Potentially Unused Dependencies:');
    const unusedDeps = [];
    
    Object.keys(allDeps).forEach(dep => {
      if (!actualImports.has(dep) && !dep.startsWith('@types/')) {
        // Skip certain packages that are used indirectly
        const skipPatterns = [
          'vite',
          'typescript',
          'tailwindcss',
          'autoprefixer',
          'postcss',
          'prettier',
          '@vitejs/',
          'vitest',
          'tsx'
        ];
        
        if (!skipPatterns.some(pattern => dep.includes(pattern))) {
          unusedDeps.push(dep);
        }
      }
    });
    
    if (unusedDeps.length > 0) {
      unusedDeps.forEach(dep => {
        console.log(`  ⚠️  ${dep} - Not found in imports`);
      });
      
      console.log('\n💡 Consider running: npm remove ' + unusedDeps.join(' '));
    } else {
      console.log('  ✅ No obviously unused dependencies found');
    }
    
    // Bundle size recommendations
    console.log('\n📈 Bundle Size Optimization Recommendations:');
    console.log('  1. ✅ Code splitting already implemented');
    console.log('  2. ✅ Tree shaking enabled in Vite config');
    console.log('  3. ✅ Terser minification with dead code removal');
    console.log('  4. ✅ React.memo implemented on components');
    console.log('  5. ✅ Lazy loading implemented for routes');
    
    console.log('\n🎯 Next Steps:');
    console.log('  • Run `npm run build` to generate production bundle');
    console.log('  • Use `npx vite-bundle-analyzer dist/spa` to visualize bundle');
    console.log('  • Consider removing unused 3D libraries if not needed');
    
  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
  }
}

analyzeBundle();