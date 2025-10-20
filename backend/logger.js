const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log file path
const logFile = path.join(logsDir, `server-${new Date().toISOString().split('T')[0]}.log`);

// Custom console.log that writes to both terminal and file
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${args.join(' ')}`;
  
  // Write to file
  fs.appendFileSync(logFile, message + '\n');
  
  // Also log to terminal
  originalLog.apply(console, args);
};

console.error = function(...args) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ERROR: ${args.join(' ')}`;
  
  // Write to file
  fs.appendFileSync(logFile, message + '\n');
  
  // Also log to terminal
  originalError.apply(console, args);
};

module.exports = {
  logFile
};



