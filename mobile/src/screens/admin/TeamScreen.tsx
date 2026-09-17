import React, { useState } from 'react';
import { Text, View, Switch } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { useAuth } from '../../context/AuthContext';
import { Workflow, Field, showError, confirmAction } from '../../components/Workflow';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';

type Member = { id: string; name: string; email: string; phone?: string; role: string; isActive: boolean };
export function TeamScreen() {
  const { user } = useAuth();
  const admin = user?.role === 'ADMIN';
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Member | null>(null);
  const [password, setPassword] = useState('');
  const query = useQuery({ queryKey: ['team'], queryFn: () => api.get<{ users: Member[] }>('/auth/users') });
  const roles = useQuery({ queryKey: ['roles'], queryFn: () => api.get<{ roles: { role: string; name: string; isActive: boolean }[] }>('/roles'), enabled: admin });
  const endorsement = useQuery({ queryKey: ['endorsement', editing?.id], queryFn: () => api.get<{ enabled: boolean }>(`/roles/users/${editing!.id}/expense-endorsement`), enabled: admin && !!editing });
  const mutation = useMutation({ mutationFn: async (action: 'save' | 'delete' | 'password' | 'endorsement') => {
    if (!admin || !editing) throw new Error('Administrator access required.');
    const path = `/auth/users/${editing.id}`;
    if (action === 'delete') return api.delete(path);
    if (action === 'password') {
      if (password.length < 8) throw new Error('Use at least 8 characters.');
      return api.put(`${path}/reset-password`, { newPassword: password });
    }
    if (action === 'endorsement') return api.patch(`/roles/users/${editing.id}/expense-endorsement`, { enabled: !endorsement.data?.enabled });
    if (!editing.name.trim() || !editing.email.trim()) throw new Error('Name and email are required.');
    return api.put(path, { name: editing.name.trim(), email: editing.email.trim(), phone: editing.phone ?? '', role: editing.role, isActive: editing.isActive });
  }, onSuccess: (_, action) => {
    if (action !== 'endorsement') { setEditing(null); setPassword(''); }
    void client.invalidateQueries();
  }, onError: showError });
  return <Workflow title="Team members" loading={query.isLoading} error={query.error} retry={() => void query.refetch()}>
    {editing && admin ? <>
      <Field label="Name" value={editing.name} onChangeText={name => setEditing({ ...editing, name })} />
      <Field label="Email" value={editing.email} autoCapitalize="none" keyboardType="email-address" onChangeText={email => setEditing({ ...editing, email })} />
      <Field label="Phone" value={editing.phone ?? ''} keyboardType="phone-pad" onChangeText={phone => setEditing({ ...editing, phone })} />
      <SelectField label="Role" value={editing.role} onChange={role => setEditing({ ...editing, role })} options={(roles.data?.roles ?? []).filter(r => r.isActive && r.role !== 'VETTING_OFFICER').map(r => ({ value: r.role, label: r.name }))} />
      <View className="flex-row items-center justify-between"><Text>Active</Text><Switch value={editing.isActive} onValueChange={isActive => setEditing({ ...editing, isActive })} /></View>
      {endorsement.data && <Button title={endorsement.data.enabled ? 'Remove expense endorsement access' : 'Allow expense endorsement'} variant="secondary" disabled={mutation.isPending} onPress={() => confirmAction('Change endorsement access?', () => mutation.mutate('endorsement'))} />}
      <Button title="Save member" loading={mutation.isPending} onPress={() => mutation.mutate('save')} />
      <Field label="New password" value={password} secureTextEntry onChangeText={setPassword} />
      <Button title="Reset password" variant="secondary" disabled={mutation.isPending} onPress={() => confirmAction('Reset member password?', () => mutation.mutate('password'))} />
      {editing.id !== user?.id && <Button title="Delete member" variant="secondary" disabled={mutation.isPending} onPress={() => confirmAction('Delete member?', () => mutation.mutate('delete'))} />}
      <Button title="Cancel" variant="ghost" disabled={mutation.isPending} onPress={() => { setEditing(null); setPassword(''); }} />
    </> : <>
      <Field label="Search team" value={search} onChangeText={setSearch} />
      {(query.data?.users ?? []).filter(m => `${m.name} ${m.email} ${m.role}`.toLowerCase().includes(search.toLowerCase())).map(m => <View key={m.id} className="border border-gray-200 rounded-xl p-4" style={{ gap: 8 }}>
        <Text className="font-semibold">{m.name}</Text><Text>{m.email}</Text><Text>{m.role} · {m.isActive ? 'Active' : 'Inactive'}</Text>
        {admin && <Button title="Edit member" variant="secondary" onPress={() => setEditing({ ...m })} />}
      </View>)}
    </>}
  </Workflow>;
}
