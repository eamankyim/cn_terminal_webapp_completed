import React, { useState } from 'react';
import { Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import { Workflow, Field, showError } from '../../components/Workflow';
import { Button } from '../../components/Button';
import type { Invoice } from '../../types/api';

function InvoiceForm({ invoice }: { invoice: Invoice }) {
  const navigation = useNavigation<any>();
  const client = useQueryClient();
  const { hasPermission } = useAuth();
  const [amount, setAmount] = useState(String(invoice.amount));
  const [issueDate, setIssueDate] = useState(invoice.issueDate.slice(0, 10));
  const [dueDate, setDueDate] = useState(invoice.dueDate.slice(0, 10));
  const mutation = useMutation({ mutationFn: () => {
    if (!hasPermission(PERMISSIONS.INVOICE_EDIT)) throw new Error('Invoice edit access required.');
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new Error('Enter a positive amount.');
    if (![issueDate, dueDate].every(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d))) || dueDate < issueDate) throw new Error('Enter valid dates with due date on or after issue date.');
    return api.put(`/invoices/${invoice.id}`, { amount: Number(amount), issueDate, dueDate });
  }, onSuccess: () => { void client.invalidateQueries(); navigation.goBack(); }, onError: showError });
  return <><Field label="Amount (GHS)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" /><Field label="Issue date (YYYY-MM-DD)" value={issueDate} onChangeText={setIssueDate} /><Field label="Due date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} /><Button title="Save invoice" loading={mutation.isPending} onPress={() => mutation.mutate()} /></>;
}
export function InvoiceEditScreen() {
  const route = useRoute<any>();
  const { hasPermission } = useAuth();
  const allowed = hasPermission(PERMISSIONS.INVOICE_EDIT);
  const invoiceId = route.params?.invoiceId;
  const query = useQuery({ queryKey: ['invoice', invoiceId], queryFn: () => api.get<{ invoice: Invoice }>(`/invoices/${invoiceId}`), enabled: allowed });
  return <Workflow title="Edit invoice" loading={query.isLoading} error={query.error} retry={() => void query.refetch()}>{!allowed ? <Text>Invoice edit access required.</Text> : query.data?.invoice && <InvoiceForm key={invoiceId} invoice={query.data.invoice} />}</Workflow>;
}
