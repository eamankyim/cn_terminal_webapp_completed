// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFiles() {
  try {
    console.log('📋 Checking all files in database...\n');

    // Get all files
    const allFiles = await prisma.file.findMany({
      select: {
        id: true,
        originalName: true,
        entityType: true,
        entityId: true,
        folder: true,
        uploadedAt: true
      },
      orderBy: { uploadedAt: 'desc' }
    });

    console.log(`Total files in database: ${allFiles.length}\n`);

    if (allFiles.length === 0) {
      console.log('❌ No files found in database!');
      return;
    }

    // Show all files
    console.log('All files:');
    console.table(allFiles);
    console.log('\n');

    // Group by entityType
    const byEntity = allFiles.reduce((acc, file) => {
      const key = file.entityType || 'NO_ENTITY';
      if (!acc[key]) acc[key] = [];
      acc[key].push(file);
      return acc;
    }, {});

    console.log('Files grouped by entity type:');
    Object.entries(byEntity).forEach(([entityType, files]) => {
      console.log(`\n${entityType}: ${files.length} files`);
      files.forEach(file => {
        console.log(`  - ${file.originalName} (entityId: ${file.entityId || 'NULL'})`);
      });
    });

    // Check for job-specific files
    const jobFiles = allFiles.filter(f => f.entityType === 'job');
    console.log(`\n\n📁 Job files: ${jobFiles.length}`);
    if (jobFiles.length > 0) {
      console.table(jobFiles);
    }

  } catch (error) {
    console.error('❌ Error checking files:');
    console.error(error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkFiles()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });

