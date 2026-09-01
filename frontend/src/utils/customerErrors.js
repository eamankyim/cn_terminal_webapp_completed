export function customerConflictMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.message ||
    'Failed to save customer'
  );
}

export function applyCustomerConflictFields(form, error) {
  const fields = error?.response?.data?.fields;
  if (!form || !Array.isArray(fields) || fields.length === 0) return;
  const nameMap = {
    email: 'email',
    phone: 'phone',
    TIN: 'tin',
    tin: 'tin'
  };
  const msg = customerConflictMessage(error);
  form.setFields(
    fields
      .map((field) => nameMap[field] || field)
      .filter(Boolean)
      .map((name) => ({ name, errors: [msg] }))
  );
}
