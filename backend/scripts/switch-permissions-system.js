const fs = require('fs');
const path = require('path');

// This script allows you to switch between file-based and database-based permissions
// Usage: node scripts/switch-permissions-system.js [file|database]

const backupFile = path.join(__dirname, '../backup/file-based-permissions-backup.js');
const permissionsFile = path.join(__dirname, '../utils/permissions.js');
const databasePermissionsFile = path.join(__dirname, '../utils/databasePermissions.js');

async function switchPermissionsSystem(systemType) {
  try {
    if (systemType === 'file') {
      // Switch to file-based system
      if (!fs.existsSync(backupFile)) {
        throw new Error('Backup file not found. Please ensure the backup exists.');
      }
      
      const backupContent = fs.readFileSync(backupFile, 'utf8');
      fs.writeFileSync(permissionsFile, backupContent);
    } else if (systemType === 'database') {
      // Switch to database-based system
      if (!fs.existsSync(databasePermissionsFile)) {
        throw new Error('Database permissions file not found.');
      }
    } else {
      throw new Error('Invalid system type. Use "file" or "database"');
    }
  } catch (error) {
    throw error;
  }
}

// Get system type from command line arguments
const systemType = process.argv[2];

if (!systemType) {
  process.exit(1);
}

// Run switch if called directly
if (require.main === module) {
  switchPermissionsSystem(systemType)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

module.exports = { switchPermissionsSystem };



