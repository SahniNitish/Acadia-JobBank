#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🧪 University Job Bank Test Runner\n');

console.log('Available test suites:');
console.log('1. Unit tests (Jest)');
console.log('2. Integration tests (Playwright)');
console.log('3. End-to-end tests (Playwright)');
console.log('4. Production tests (Playwright)');
console.log('5. All tests');
console.log('6. Deployment validation');
console.log('7. Performance tests (Lighthouse)');

rl.question('\nSelect test suite (1-7): ', (answer) => {
  let command;
  
  switch (answer) {
    case '1':
      console.log('\n🔬 Running unit tests...');
      command = 'npm run test:ci';
      break;
    case '2':
      console.log('\n🔗 Running integration tests...');
      command = 'npm run test:integration';
      break;
    case '3':
      console.log('\n🎭 Running end-to-end tests...');
      command = 'npm run test:e2e';
      break;
    case '4':
      console.log('\n🌐 Running production tests...');
      command = 'npm run test:production';
      break;
    case '5':
      console.log('\n🚀 Running all tests...');
      command = 'npm run test:all';
      break;
    case '6':
      console.log('\n✅ Running deployment validation...');
      command = 'npm run validate:deployment';
      break;
    case '7':
      console.log('\n⚡ Running performance tests...');
      command = 'npx lhci autorun';
      break;
    default:
      console.log('❌ Invalid selection');
      rl.close();
      return;
  }
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('\n✅ Tests completed successfully!');
  } catch (error) {
    console.log('\n❌ Tests failed!');
    process.exit(1);
  }
  
  rl.close();
});