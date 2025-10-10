const fs = require('fs');
const path = require('path');

// This script restores the file-based permissions system
// Use this when you want to go back to file-based permissions

const backupFile = path.join(__dirname, '../backup/file-based-permissions-backup.js');
const targetFile = path.join(__dirname, '../utils/permissions.js');

async function restoreFilePermissions() {
  try {
    // Check if backup file exists
    if (!fs.existsSync(backupFile)) {
      throw new Error('Backup file not found. Please ensure the backup exists.');
    }
    
    // Read backup content
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    
    // Remove the backup header comment
    const cleanContent = backupContent.replace(/^\/\/ BACKUP: File-based permissions system[\s\S]*?module\.exports = \{[\s\S]*?\};$/m, '');
    
    // Write to target file
    fs.writeFileSync(targetFile, backupContent);
  } catch (error) {
    throw error;
  }
}

// Run restore if called directly
if (require.main === module) {
  restoreFilePermissions()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

module.exports = { restoreFilePermissions };



