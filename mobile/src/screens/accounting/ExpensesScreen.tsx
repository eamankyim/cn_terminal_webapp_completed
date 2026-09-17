import React, { useState } from 'react';
import { Text, View, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { fetchAllPages } from '../../api/pagination';
import { useAuth } from '../../context/AuthContext';
import { UI_PERMISSIONS, PERMISSIONS } from '../../utils/permissions';
import { Workflow, Field, options, showError } from '../../components/Workflow';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';

type Expense = { id: string; amount: number; description: string; category: string; categoryOther?: string; expenseDate: string; receiptUrl?: string; request?: { requestedBy?: { name: string } } };
export function ExpensesScreen() {
  const { hasPermission } = useAuth();
  const allowed = hasPermission(UI_PERMISSIONS.ACCOUNTING);
  const canCreate = hasPermission(PERMISSIONS.EXPENSE_CREATE);
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('OPERATIONS');
  const [categoryOther, setCategoryOther] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [jobId, setJobId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const query = useQuery({ queryKey: ['expenses', page], queryFn: () => api.get<{ expenses: Expense[]; pagination: { pages: number } }>(`/expenses?page=${page}&limit=20`), enabled: allowed });
  const jobs = useQuery({ queryKey: ['expense-jobs'], queryFn: () => fetchAllPages<{ id: string; trackingId: string }>('/jobs', 'jobs'), enabled: allowed && creating });
  const mutation = useMutation({ mutationFn: () => {
    if (!canCreate) throw new Error('Expense recording access required.');
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !description.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) throw new Error('Enter a positive amount, description, and valid date.');
    if (category === 'OTHER' && !categoryOther.trim()) throw new Error('Enter the category name.');
    if (receiptUrl && !/^https?:\/\//i.test(receiptUrl)) throw new Error('Enter an HTTP or HTTPS receipt URL.');
    return api.post('/expenses/record', { amount: Number(amount), category, categoryOther: category === 'OTHER' ? categoryOther.trim() : null, description: description.trim(), expenseDate: date, jobId: jobId || null, receiptUrl: receiptUrl || null });
  }, onSuccess: () => { setCreating(false); setAmount(''); setDescription(''); setReceiptUrl(''); void client.invalidateQueries(); }, onError: showError });
  return <Workflow title="Recorded expenses" loading={query.isLoading} error={query.error} retry={() => void query.refetch()}>
    {!allowed ? <Text>Accounting access required.</Text> : creating ? <>
      <Field label="Amount (GHS)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <SelectField label="Category" value={category} onChange={setCategory} options={options(['FUEL', 'MATERIALS', 'OPERATIONS', 'MISCELLANEOUS', 'OTHER'])} />
      {category === 'OTHER' && <Field label="Category name" value={categoryOther} onChangeText={setCategoryOther} />}
      <Field label="Description" value={description} onChangeText={setDescription} multiline />
      <Field label="Expense date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <SelectField label="Job (optional)" value={jobId} onChange={setJobId} options={[{ value: '', label: 'No job' }, ...(jobs.data ?? []).map(j => ({ value: j.id, label: j.trackingId }))]} />
      <Field label="Receipt URL (optional)" value={receiptUrl} onChangeText={setReceiptUrl} autoCapitalize="none" keyboardType="url" />
      <Button title="Record expense" loading={mutation.isPending} onPress={() => mutation.mutate()} />
      <Button title="Cancel" variant="ghost" disabled={mutation.isPending} onPress={() => setCreating(false)} />
    </> : <>
      {canCreate && <Button title="Record expense" onPress={() => setCreating(true)} />}
      {(query.data?.expenses ?? []).map(row => <View key={row.id} className="border border-gray-200 rounded-xl p-4" style={{ gap: 8 }}><Text className="font-semibold">GHS {Number(row.amount).toFixed(2)} · {row.categoryOther || row.category}</Text><Text>{row.description}</Text><Text>{row.request?.requestedBy?.name} · {new Date(row.expenseDate).toLocaleDateString()}</Text>{row.receiptUrl && /^https?:\/\//i.test(row.receiptUrl) && <Button title="View receipt" variant="secondary" onPress={() => { void Linking.openURL(row.receiptUrl!).catch(showError); }} />}</View>)}
      {!query.data?.expenses.length && <Text>No recorded expenses.</Text>}
      <View className="flex-row justify-between"><Button title="Previous" variant="secondary" disabled={page === 1} onPress={() => setPage(page - 1)} /><Text>Page {page}</Text><Button title="Next" variant="secondary" disabled={page >= (query.data?.pagination.pages ?? 1)} onPress={() => setPage(page + 1)} /></View>
    </>}
  </Workflow>;
}
