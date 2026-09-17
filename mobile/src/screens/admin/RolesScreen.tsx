import { UI_PERMISSIONS } from '../../utils/permissions';
import React, { useState } from 'react';
import { Text, View, Switch } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { useAuth } from '../../context/AuthContext';
import { Workflow, Field, showError, confirmAction } from '../../components/Workflow';
import { Button } from '../../components/Button';

type Role = { role: string; name: string; isSystem: boolean; permissions: string[]; userCount: number };
export function RolesScreen() {
  const { user } = useAuth();
  const allowed = ['ADMIN', 'IT_CONSULTANT'].includes(user?.role ?? '');
  const client = useQueryClient();
  const [editing, setEditing] = useState<Role | null>(null);
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['roles'], queryFn: () => api.get<{ roles: Role[] }>('/roles'), enabled: allowed });
  const permissions = useQuery({ queryKey: ['available-permissions'], queryFn: () => api.get<{ permissions: { permission: string; key: string }[] }>('/roles/permissions'), enabled: allowed });
  const mutation = useMutation({ mutationFn: () => {
    if (!allowed || !editing || editing.isSystem) throw new Error('This role cannot be edited.');
    return api.put(`/roles/${encodeURIComponent(editing.role)}/permissions`, { permissions: editing.permissions });
  }, onSuccess: () => { setEditing(null); void client.invalidateQueries(); }, onError: showError });
  return <Workflow title="Roles and permissions" loading={query.isLoading || permissions.isLoading} error={query.error || permissions.error} retry={() => { void query.refetch(); void permissions.refetch(); }}>
    {!allowed ? <Text>Administrator access required.</Text> : editing ? <>
      <Text className="text-lg font-semibold">{editing.name}</Text>
      <Text>Saving permissions signs affected users out so the updated permissions take effect.</Text>
      <Field label="Search permissions" value={search} onChangeText={setSearch} />
      {[...new Set([...Object.values(UI_PERMISSIONS), ...(permissions.data?.permissions ?? []).map(p => p.permission), ...editing.permissions])].filter(p => p.toLowerCase().includes(search.toLowerCase())).map(permission => <View key={permission} className="flex-row justify-between items-center"><Text style={{ flex: 1 }}>{permission}</Text><Switch disabled={mutation.isPending || editing.isSystem} value={editing.permissions.includes(permission)} onValueChange={enabled => setEditing({ ...editing, permissions: enabled ? [...editing.permissions, permission] : editing.permissions.filter(p => p !== permission) })} /></View>)}
      {!editing.isSystem && <Button title="Save permissions" loading={mutation.isPending} onPress={() => confirmAction('Update role permissions?', () => mutation.mutate())} />}
      <Button title="Back to roles" variant="secondary" disabled={mutation.isPending} onPress={() => setEditing(null)} />
    </> : (query.data?.roles ?? []).map(role => <View key={role.role} className="border border-gray-200 rounded-xl p-4" style={{ gap: 8 }}><Text className="font-semibold">{role.name}</Text><Text>{role.userCount} members · {role.permissions.length} permissions</Text><Button title={role.isSystem ? 'View permissions' : 'Edit permissions'} variant="secondary" onPress={() => { setEditing({ ...role, permissions: [...role.permissions] }); setSearch(''); }} /></View>)}
  </Workflow>;
}
