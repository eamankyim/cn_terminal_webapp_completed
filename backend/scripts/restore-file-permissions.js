const fs = require('fs');
const path = require('path');

// This script restores the file-based permissions system
// Use this when you want to go back to file-based permissions

const backupFile = path.join(__dirname, '../backup/file-based-permissions-backup.js');
const targetFile = path.join(__dirname, '../utils/permissions.js');

async function restoreFilePermissions() {
  try {
    console.log('🔄 Restoring file-based permissions system...');
    
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
    
    console.log('✅ File-based permissions system restored successfully!');
    console.log('📁 Restored to:', targetFile);
    console.log('💡 You may need to restart the server for changes to take effect.');
    
  } catch (error) {
    console.error('❌ Failed to restore file-based permissions:', error);
    throw error;
  }
}

// Run restore if called directly
if (require.main === module) {
  restoreFilePermissions()
    .then(() => {
      console.log('✅ Restore completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Restore failed:', error);
      process.exit(1);
    });
}

module.exports = { restoreFilePermissions };


