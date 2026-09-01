const { prisma } = require('../config/database');

const normalizeOptional = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
};

const FIELD_LABELS = {
  email: 'email',
  phone: 'phone',
  tin: 'TIN'
};

async function findCustomerUniquenessConflicts({ email, phone, tin, excludeId }) {
  const checks = [];
  const normalizedEmail = normalizeOptional(email);
  const normalizedPhone = normalizeOptional(phone);
  const normalizedTin = normalizeOptional(tin);

  if (normalizedEmail) {
    checks.push({ field: 'email', value: normalizedEmail, insensitive: true });
  }
  if (normalizedPhone) {
    checks.push({ field: 'phone', value: normalizedPhone, insensitive: false });
  }
  if (normalizedTin) {
    checks.push({ field: 'tin', value: normalizedTin, insensitive: true });
  }

  const conflicts = [];
  await Promise.all(
    checks.map(async ({ field, value, insensitive }) => {
      const existing = await prisma.customer.findFirst({
        where: {
          AND: [
            insensitive
              ? { [field]: { equals: value, mode: 'insensitive' } }
              : { [field]: value },
            ...(excludeId ? [{ id: { not: excludeId } }] : [])
          ]
        },
        select: { id: true }
      });
      if (existing) {
        conflicts.push(FIELD_LABELS[field] || field);
      }
    })
  );

  return conflicts;
}

function uniquenessConflictResponse(conflicts) {
  if (!conflicts.length) return null;
  const listed =
    conflicts.length === 1
      ? conflicts[0]
      : `${conflicts.slice(0, -1).join(', ')} and ${conflicts[conflicts.length - 1]}`;
  return {
    error: `A customer with this ${listed} already exists`,
    fields: conflicts
  };
}

function prismaUniqueConflictResponse(error) {
  if (error?.code !== 'P2002') return null;
  const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
  const conflicts = target
    .map((field) => FIELD_LABELS[field] || field)
    .filter(Boolean);
  if (!conflicts.length) {
    return {
      error: 'A customer with this email, phone, or TIN already exists',
      fields: []
    };
  }
  return uniquenessConflictResponse(conflicts);
}

module.exports = {
  normalizeOptional,
  findCustomerUniquenessConflicts,
  uniquenessConflictResponse,
  prismaUniqueConflictResponse
};
