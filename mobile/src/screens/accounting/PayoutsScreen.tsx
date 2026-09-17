import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { fetchAllPages } from '../../api/pagination';
import { useAuth } from '../../context/AuthContext';
import { UI_PERMISSIONS } from '../../utils/permissions';
import { Workflow, Field, options, showError, confirmAction } from '../../components/Workflow';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';

type Payout = { id: string; payee: string; amount: number; paymentMethod: string; purpose: string; status: string; jobId?: string | null };
type Draft = Omit<Payout, 'amount'> & { amount: string };
const blank: Draft = { id: '', payee: '', amount: '', paymentMethod: 'BANK_TRANSFER', purpose: '', status: 'PENDING', jobId: null };
export function PayoutsScreen() {
  const { hasPermission } = useAuth();
  const allowed = hasPermission(UI_PERMISSIONS.ACCOUNTING);
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<Draft | null>(null);
  const query = useQuery({ queryKey: ['payouts', page, status], queryFn: () => api.get<{ payouts: Payout[]; pagination: { pages: number } }>(`/payouts?page=${page}&limit=20&status=${status}`), enabled: allowed });
  const jobs = useQuery({ queryKey: ['payout-jobs'], queryFn: () => fetchAllPages<{ id: string; trackingId: string }>('/jobs', 'jobs'), enabled: allowed && !!editing });
  const mutation = useMutation({ mutationFn: async ({ action, row }: { action: 'save' | 'delete' | 'COMPLETED' | 'FAILED'; row?: Payout }) => {
    if (!allowed) throw new Error('Accounting access required.');
    if (action === 'delete') return api.delete(`/payouts/${row!.id}`);
    if (action !== 'save') return api.patch(`/payouts/${row!.id}/status`, { status: action, paymentDate: new Date().toISOString() });
    if (!editing) return;
    const amount = Number(editing.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !editing.payee.trim() || !editing.purpose.trim()) throw new Error('Payee, purpose, and a positive amount are required.');
    const body = { payee: editing.payee.trim(), purpose: editing.purpose.trim(), amount, paymentMethod: editing.paymentMethod, jobId: editing.jobId || null };
    return editing.id ? api.patch(`/payouts/${editing.id}`, body) : api.post('/payouts', body);
  }, onSuccess: () => { setEditing(null); void client.invalidateQueries(); }, onError: showError });
  if (!allowed) return <Workflow title="Payouts"><Text>Accounting access required.</Text></Workflow>;
  return <Workflow title="Payouts" loading={query.isLoading} error={query.error} retry={() => void query.refetch()}>
    {editing ? <>
      <Field label="Payee" value={editing.payee} onChangeText={payee => setEditing({ ...editing, payee })} />
      <Field label="Amount (GHS)" value={editing.amount} keyboardType="decimal-pad" onChangeText={amount => setEditing({ ...editing, amount })} />
      <Field label="Purpose" value={editing.purpose} multiline onChangeText={purpose => setEditing({ ...editing, purpose })} />
      <SelectField label="Payment method" value={editing.paymentMethod} onChange={paymentMethod => setEditing({ ...editing, paymentMethod })} options={options(['BANK_TRANSFER', 'MOBILE_MONEY', 'CASH', 'CARD'])} />
      <SelectField label="Job (optional)" value={editing.jobId ?? ''} onChange={jobId => setEditing({ ...editing, jobId })} options={[{ value: '', label: 'No job' }, ...(jobs.data ?? []).map(j => ({ value: j.id, label: j.trackingId }))]} />
      {jobs.error && <Text className="text-red-700">{jobs.error.message}</Text>}
      <Button title="Save payout" loading={mutation.isPending} onPress={() => mutation.mutate({ action: 'save' })} />
      <Button title="Cancel" variant="ghost" disabled={mutation.isPending} onPress={() => setEditing(null)} />
    </> : <>
      <Button title="Create payout" onPress={() => setEditing({ ...blank })} />
      <SelectField label="Status" value={status} onChange={value => { setStatus(value); setPage(1); }} options={[{ value: '', label: 'All statuses' }, ...options(['PENDING', 'COMPLETED', 'FAILED'])]} />
      {(query.data?.payouts ?? []).map(row => <View key={row.id} className="border border-gray-200 rounded-xl p-4" style={{ gap: 8 }}><Text className="font-semibold">{row.payee} · GHS {Number(row.amount).toFixed(2)}</Text><Text>{row.purpose}</Text><Text>{row.status} · {row.paymentMethod}</Text>
        {row.status !== 'COMPLETED' && <>
          <Button title="Edit" variant="secondary" disabled={mutation.isPending} onPress={() => setEditing({ ...row, amount: String(row.amount) })} />
          <Button title="Mark completed" disabled={mutation.isPending} onPress={() => confirmAction('Complete payout?', () => mutation.mutate({ action: 'COMPLETED', row }))} />
          <Button title="Mark failed" variant="secondary" disabled={mutation.isPending} onPress={() => confirmAction('Mark payout failed?', () => mutation.mutate({ action: 'FAILED', row }))} />
          <Button title="Delete" variant="ghost" disabled={mutation.isPending} onPress={() => confirmAction('Delete payout?', () => mutation.mutate({ action: 'delete', row }))} />
        </>}
      </View>)}
      {!query.data?.payouts.length && <Text>No payouts found.</Text>}
      <View className="flex-row justify-between"><Button title="Previous" variant="secondary" disabled={page === 1} onPress={() => setPage(page - 1)} /><Text>Page {page}</Text><Button title="Next" variant="secondary" disabled={page >= (query.data?.pagination.pages ?? 1)} onPress={() => setPage(page + 1)} /></View>
    </>}
  </Workflow>;
}
