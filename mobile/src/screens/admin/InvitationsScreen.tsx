import React, { useState } from 'react';
import { Text, View, Share } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { useAuth } from '../../context/AuthContext';
import { Workflow, Field, showError, confirmAction } from '../../components/Workflow';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';

type Invitation = { id: string; email: string; role: string; status: string; expiresAt: string };
export function InvitationsScreen() {
  const { user } = useAuth();
  const allowed = user?.role === 'ADMIN';
  const client = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STAFF');
  const [link, setLink] = useState('');
  const query = useQuery({ queryKey: ['invitations'], queryFn: () => api.get<{ invitations: Invitation[] }>('/invitations'), enabled: allowed });
  const roles = useQuery({ queryKey: ['roles'], queryFn: () => api.get<{ roles: { role: string; name: string; isActive: boolean }[] }>('/roles'), enabled: allowed });
  const mutation = useMutation({ mutationFn: async ({ action, id }: { action: 'send' | 'resend' | 'cancel'; id?: string }) => {
    if (!allowed) throw new Error('Administrator access required.');
    if (action === 'cancel') return api.delete<{ inviteLink?: string }>(`/invitations/${id}`);
    if (action === 'resend') return api.post<{ inviteLink?: string }>(`/invitations/${id}/resend`, {});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Enter a valid email.');
    return api.post<{ inviteLink?: string }>('/invitations', { email: email.trim(), role });
  }, onSuccess: (data, variables) => { if (variables.action === 'send') setEmail(''); setLink(data.inviteLink ?? ''); void client.invalidateQueries({ queryKey: ['invitations'] }); }, onError: showError });
  return <Workflow title="Invitations" loading={query.isLoading} error={query.error} retry={() => void query.refetch()}>
    {!allowed ? <Text>Administrator access required.</Text> : <>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <SelectField label="Role" value={role} onChange={setRole} options={(roles.data?.roles ?? []).filter(r => r.isActive && !['ADMIN', 'IT_CONSULTANT', 'VETTING_OFFICER'].includes(r.role)).map(r => ({ value: r.role, label: r.name }))} />
      <Button title="Send invitation" loading={mutation.isPending} onPress={() => mutation.mutate({ action: 'send' })} />
      {!!link && <Button title="Share invitation link" variant="secondary" onPress={() => { void Share.share({ message: link }).catch(showError); }} />}
      {(query.data?.invitations ?? []).map(inv => <View key={inv.id} className="border border-gray-200 rounded-xl p-4" style={{ gap: 8 }}><Text className="font-semibold">{inv.email}</Text><Text>{inv.role} · {inv.status}</Text><Text>Expires {new Date(inv.expiresAt).toLocaleDateString()}</Text>
        {inv.status === 'PENDING' && <><Button title="Resend" variant="secondary" disabled={mutation.isPending} onPress={() => mutation.mutate({ action: 'resend', id: inv.id })} /><Button title="Cancel invitation" variant="ghost" disabled={mutation.isPending} onPress={() => confirmAction('Cancel invitation?', () => mutation.mutate({ action: 'cancel', id: inv.id }))} /></>}
      </View>)}
    </>}
  </Workflow>;
}
