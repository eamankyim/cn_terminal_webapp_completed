# Permissions System Backup & Restore

This directory contains backup files and scripts for managing the permissions system.

## Files

- `file-based-permissions-backup.js` - Complete backup of the file-based permissions system
- `../scripts/restore-file-permissions.js` - Script to restore file-based permissions
- `../scripts/switch-permissions-system.js` - Script to switch between systems

## Usage

### Backup File-Based Permissions
The file-based permissions system has been automatically backed up to:
```
backend/backup/file-based-permissions-backup.js
```

### Restore File-Based Permissions
To restore the file-based permissions system:
```bash
cd backend
node scripts/restore-file-permissions.js
```

### Switch Between Systems
To switch between file-based and database-based permissions:
```bash
cd backend

# Switch to file-based system
node scripts/switch-permissions-system.js file

# Switch to database-based system
node scripts/switch-permissions-system.js database
```

## When to Use Each System

### File-Based Permissions (Backup)
- ✅ Simple and fast
- ✅ Version controlled
- ✅ No database dependencies
- ❌ No runtime changes
- ❌ Limited flexibility

**Use when:**
- Database is cleared/reset
- You want simple, static permissions
- You don't need dynamic role management

### Database-Based Permissions (New)
- ✅ Dynamic role management
- ✅ User-specific permissions
- ✅ Audit trail
- ✅ Permission expiration
- ❌ More complex
- ❌ Requires database

**Use when:**
- You need dynamic permissions
- You want user-specific permissions
- You need audit trails
- You want to manage permissions at runtime

## Migration Process

1. **Backup Created**: File-based system backed up ✅
2. **Database Schema**: New tables created ✅
3. **Migration Script**: Ready to populate database ✅
4. **API Updated**: Endpoints ready for database ✅

## Quick Commands

```bash
# Restore file-based system (when DB is cleared)
node scripts/restore-file-permissions.js

# Switch to database-based system
node scripts/switch-permissions-system.js database

# Run database migration
npx prisma db push

# Populate database with permissions
node scripts/migrate-permissions.js
```

## Notes

- The backup contains all 41 permissions and 10 roles
- All role-permission mappings are preserved
- The backup can be used anytime the database is cleared
- Both systems can coexist (use imports to switch between them)






