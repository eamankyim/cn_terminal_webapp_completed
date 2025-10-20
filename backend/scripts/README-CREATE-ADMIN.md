# Create Admin Script

This script creates the first admin user for the CN Terminal Web Application.

## Admin Credentials

- **Email**: `admin@cnterminal.com`
- **Password**: `111111@1A`
- **Name**: System Administrator
- **Role**: ADMIN

## How to Run

### Option 1: Using npm script (Recommended)

```bash
cd backend
npm run create-admin
```

### Option 2: Direct execution

```bash
cd backend
node scripts/create-admin.js
```

## What the Script Does

1. Checks if an admin user with the email `admin@cnterminal.com` already exists
2. If exists, displays the existing user information and exits
3. If not exists:
   - Hashes the password using bcrypt with 12 salt rounds
   - Creates a new user with ADMIN role
   - Displays the created user information

## Prerequisites

- Database must be set up and running
- `.env` file must be configured with `DATABASE_URL`
- Prisma client must be generated (`npm run db:generate`)
- Database schema must be migrated (`npm run db:migrate` or `npm run db:push`)

## Security Notes

- The password is securely hashed using bcrypt before storing in the database
- The script will NOT overwrite an existing admin user
- Always change the default password after first login in production environments

## Troubleshooting

### Error: "Can't reach database server"
- Make sure your database is running
- Check your `DATABASE_URL` in the `.env` file
- Verify database connection parameters

### Error: "Admin user already exists"
- This is normal if you've already run the script
- Use the existing credentials to login
- To create a different admin, delete the existing one first or modify the script

### Error: "Prisma Client not initialized"
- Run `npm run db:generate` to generate the Prisma client
- Run `npm run db:push` to sync your database schema

