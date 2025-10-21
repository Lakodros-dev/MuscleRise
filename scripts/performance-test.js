#!/usr/bin/env node

/**
 * Performance Test Script
 * Tests the optimizations implemented
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function measureBuildTime() {
  console.log('⏱️  Measuring build time...');
  const startTime = Date.now();
  
  try {
    await runCommand('npm', ['run', 'build']);
    const endTime = Date.now();
    const buildTime = (endTime - startTime) / 1000;
    
    console.log(`✅ Build completed in ${buildTime.toFixed(2)} seconds`);
    return buildTime;
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    throw error;
  }
}

async function analyzeBundleSize() {
  console.log('\n📊 Analyzing bundle size...');
  
  try {
    const distPath = path.join(PROJECT_ROOT, 'dist', 'spa');
    const files = await fs.readdir(distPath, { withFileTypes: true });
    
    let totalSize = 0;
    const chunks = [];
    
    for (const file of files) {
      if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.css'))) {
        const filePath = path.join(distPath, file.name);
        const stats = await fs.stat(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        
        chunks.push({
          name: file.name,
          size: parseFloat(sizeKB)
        });
        
        totalSize += parseFloat(sizeKB);
      }
    }
    
    // Sort by size
    chunks.sort((a, b) => b.size - a.size);
    
    console.log('\n📦 Bundle Analysis:');
    console.log(`  Total bundle size: ${totalSize.toFixed(2)} KB`);
    
    console.log('\n  Largest chunks:');
    chunks.slice(0, 5).forEach(chunk => {
      console.log(`    ${chunk.name}: ${chunk.size} KB`);
    });
    
    // Performance recommendations
    if (totalSize > 1000) {
      console.log('\n⚠️  Large bundle detected (>1MB). Consider:');
      console.log('    • Additional code splitting');
      console.log('    • Removing unused dependencies');
      console.log('    • Implementing dynamic imports');
    } else if (totalSize > 500) {
      console.log('\n✅ Good bundle size (<1MB)');
    } else {
      console.log('\n🎉 Excellent bundle size (<500KB)');
    }
    
    return { totalSize, chunks };
    
  } catch (error) {
    console.error('❌ Failed to analyze bundle size:', error.message);
    throw error;
  }
}

async function checkTypeScriptPerformance() {
  console.log('\n🔍 Running TypeScript type check...');
  const startTime = Date.now();
  
  try {
    await runCommand('npm', ['run', 'typecheck']);
    const endTime = Date.now();
    const typeCheckTime = (endTime - startTime) / 1000;
    
    console.log(`✅ TypeScript check completed in ${typeCheckTime.toFixed(2)} seconds`);
    return typeCheckTime;
  } catch (error) {
    console.error('❌ TypeScript check failed:', error.message);
    throw error;
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests');
  console.log('=' .repeat(50));
  
  try {
    // Run TypeScript check first
    const typeCheckTime = await checkTypeScriptPerformance();
    
    // Measure build time
    const buildTime = await measureBuildTime();
    
    // Analyze bundle size
    const bundleAnalysis = await analyzeBundleSize();
    
    // Summary
    console.log('\n📋 Performance Summary:');
    console.log('=' .repeat(30));
    console.log(`  TypeScript check: ${typeCheckTime.toFixed(2)}s`);
    console.log(`  Build time: ${buildTime.toFixed(2)}s`);
    console.log(`  Bundle size: ${bundleAnalysis.totalSize.toFixed(2)} KB`);
    
    // Performance grades
    console.log('\n🎯 Performance Grades:');
    
    const typeCheckGrade = typeCheckTime < 10 ? 'A' : typeCheckTime < 20 ? 'B' : 'C';
    const buildGrade = buildTime < 30 ? 'A' : buildTime < 60 ? 'B' : 'C';
    const bundleGrade = bundleAnalysis.totalSize < 500 ? 'A' : bundleAnalysis.totalSize < 1000 ? 'B' : 'C';
    
    console.log(`  TypeScript Performance: ${typeCheckGrade}`);
    console.log(`  Build Performance: ${buildGrade}`);
    console.log(`  Bundle Size: ${bundleGrade}`);
    
    const overallGrade = [typeCheckGrade, buildGrade, bundleGrade].includes('C') ? 'C' :
                        [typeCheckGrade, buildGrade, bundleGrade].includes('B') ? 'B' : 'A';
                        
    console.log(`  Overall Grade: ${overallGrade}`);
    
    console.log('\n✅ Performance tests completed!');
    
  } catch (error) {
    console.error('\n❌ Performance tests failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runPerformanceTests();