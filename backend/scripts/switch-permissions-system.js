const fs = require('fs');
const path = require('path');

// This script allows you to switch between file-based and database-based permissions
// Usage: node scripts/switch-permissions-system.js [file|database]

const backupFile = path.join(__dirname, '../backup/file-based-permissions-backup.js');
const permissionsFile = path.join(__dirname, '../utils/permissions.js');
const databasePermissionsFile = path.join(__dirname, '../utils/databasePermissions.js');

async function switchPermissionsSystem(systemType) {
  try {
    console.log(`🔄 Switching to ${systemType}-based permissions system...`);
    
    if (systemType === 'file') {
      // Switch to file-based system
      if (!fs.existsSync(backupFile)) {
        throw new Error('Backup file not found. Please ensure the backup exists.');
      }
      
      const backupContent = fs.readFileSync(backupFile, 'utf8');
      fs.writeFileSync(permissionsFile, backupContent);
      
      console.log('✅ Switched to file-based permissions system');
      console.log('📁 Updated:', permissionsFile);
      
    } else if (systemType === 'database') {
      // Switch to database-based system
      if (!fs.existsSync(databasePermissionsFile)) {
        throw new Error('Database permissions file not found.');
      }
      
      console.log('✅ Database-based permissions system is already available');
      console.log('📁 Database permissions file:', databasePermissionsFile);
      console.log('💡 Update your imports to use databasePermissions instead of permissions');
      
    } else {
      throw new Error('Invalid system type. Use "file" or "database"');
    }
    
    console.log('💡 You may need to restart the server for changes to take effect.');
    
  } catch (error) {
    console.error('❌ Failed to switch permissions system:', error);
    throw error;
  }
}

// Get system type from command line arguments
const systemType = process.argv[2];

if (!systemType) {
  console.log('Usage: node scripts/switch-permissions-system.js [file|database]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/switch-permissions-system.js file      # Switch to file-based');
  console.log('  node scripts/switch-permissions-system.js database  # Switch to database-based');
  process.exit(1);
}

// Run switch if called directly
if (require.main === module) {
  switchPermissionsSystem(systemType)
    .then(() => {
      console.log('✅ Switch completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Switch failed:', error);
      process.exit(1);
    });
}

module.exports = { switchPermissionsSystem };




