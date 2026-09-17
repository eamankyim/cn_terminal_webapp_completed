import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { fetchAllPages } from '../../api/pagination';
import { useAuth } from '../../context/AuthContext';
import { UI_PERMISSIONS } from '../../utils/permissions';
import { Workflow, Field, options, showError } from '../../components/Workflow';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';

type Transaction = { id: string; type: string; amount: number; description: string; transactionDate: string; sourceType: string };
export function CashflowScreen() {
  const { hasPermission } = useAuth();
  const allowed = hasPermission(UI_PERMISSIONS.ACCOUNTING);
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState('INFLOW');
  const [sourceType, setSourceType] = useState('OTHER');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [jobId, setJobId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const query = useQuery({ queryKey: ['cashflow-transactions', page, filter], queryFn: () => api.get<{ transactions: Transaction[]; pagination: { pages: number } }>(`/cashflow/transactions?page=${page}&limit=20&type=${filter}`), enabled: allowed });
  const jobs = useQuery({ queryKey: ['cashflow-jobs'], queryFn: () => fetchAllPages<{ id: string; trackingId: string }>('/jobs', 'jobs'), enabled: allowed && creating });
  const mutation = useMutation({ mutationFn: () => {
    if (!allowed) throw new Error('Accounting access required.');
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !description.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error('Enter a positive amount, description, and valid date.');
    return api.post('/cashflow/transactions', { type, sourceType, amount: Number(amount), description: description.trim(), jobId: jobId || null, transactionDate: date });
  }, onSuccess: () => { setCreating(false); setAmount(''); setDescription(''); void client.invalidateQueries(); }, onError: showError });
  return <Workflow title="Cashflow" loading={query.isLoading} error={query.error} retry={() => void query.refetch()}>
    {!allowed ? <Text>Accounting access required.</Text> : creating ? <>
      <SelectField label="Type" value={type} onChange={setType} options={options(['INFLOW', 'OUTFLOW'])} />
      <SelectField label="Source" value={sourceType} onChange={setSourceType} options={options(['INVOICE', 'EXPENSE', 'PAYOUT', 'OTHER'])} />
      <Field label="Amount (GHS)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Field label="Description" value={description} onChangeText={setDescription} multiline />
      <Field label="Transaction date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <SelectField label="Job (optional)" value={jobId} onChange={setJobId} options={[{ value: '', label: 'No job' }, ...(jobs.data ?? []).map(j => ({ value: j.id, label: j.trackingId }))]} />
      <Button title="Save transaction" loading={mutation.isPending} onPress={() => mutation.mutate()} />
      <Button title="Cancel" variant="ghost" disabled={mutation.isPending} onPress={() => setCreating(false)} />
    </> : <>
      <Button title="Create transaction" onPress={() => setCreating(true)} />
      <SelectField label="Type" value={filter} onChange={v => { setFilter(v); setPage(1); }} options={[{ value: '', label: 'All transactions' }, ...options(['INFLOW', 'OUTFLOW'])]} />
      {(query.data?.transactions ?? []).map(row => <View key={row.id} className="border border-gray-200 rounded-xl p-4" style={{ gap: 8 }}><Text className="font-semibold">{row.type} · GHS {Number(row.amount).toFixed(2)}</Text><Text>{row.description}</Text><Text>{row.sourceType} · {new Date(row.transactionDate).toLocaleDateString()}</Text></View>)}
      {!query.data?.transactions.length && <Text>No transactions found.</Text>}
      <View className="flex-row justify-between"><Button title="Previous" variant="secondary" disabled={page === 1} onPress={() => setPage(page - 1)} /><Text>Page {page}</Text><Button title="Next" variant="secondary" disabled={page >= (query.data?.pagination.pages ?? 1)} onPress={() => setPage(page + 1)} /></View>
    </>}
  </Workflow>;
}
