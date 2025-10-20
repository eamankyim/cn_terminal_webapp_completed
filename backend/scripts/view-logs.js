const fs = require('fs');
const path = require('path');

// Get today's log file
const logsDir = path.join(__dirname, '..', 'logs');
const today = new Date().toISOString().split('T')[0];
const logFile = path.join(logsDir, `server-${today}.log`);

console.log('📋 Viewing logs from:', logFile);
console.log('='.repeat(80));

if (!fs.existsSync(logFile)) {
  console.log('❌ No log file found for today.');
  console.log('Log file should be at:', logFile);
  process.exit(1);
}

// Read and display the log file
const logs = fs.readFileSync(logFile, 'utf8');
console.log(logs);

console.log('='.repeat(80));
console.log('✅ End of logs');



