import { clearConfigListCache } from '../../api/configLists';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { useAuth } from '../../context/AuthContext';
import { UI_PERMISSIONS } from '../../utils/permissions';
import { Workflow, Field, options, showError, confirmAction } from '../../components/Workflow';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';

type Configuration = { key: string; value: string; type: string; category: string; description?: string; isConfigured?: boolean; isActive?: boolean };
const empty: Configuration = { key: '', value: '', type: 'STRING', category: 'SYSTEM', description: '' };
export function ConfigurationScreen() {
  const { hasPermission } = useAuth();
  const allowed = hasPermission(UI_PERMISSIONS.CONFIGURATION);
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Configuration | null>(null);
  const [isNew, setIsNew] = useState(false);
  const query = useQuery({ queryKey: ['configurations'], queryFn: () => api.get<{ data: Record<string, Configuration[]> }>('/configurations'), enabled: allowed });
  const mutation = useMutation({ mutationFn: async (action: 'save' | 'delete' | 'init') => {
    if (!allowed) throw new Error('Configuration access required.');
    if (action === 'init') return api.post('/configurations/init', {});
    if (!editing) return;
    if (action === 'delete') return api.delete(`/configurations/${encodeURIComponent(editing.key)}`);
    if (!editing.key.trim() || !editing.category.trim()) throw new Error('Key and category are required.');
    if (editing.type === 'JSON') JSON.parse(editing.value);
    if (['NUMBER', 'CURRENCY', 'PERCENTAGE'].includes(editing.type) && (!editing.value.trim() || !Number.isFinite(Number(editing.value)))) throw new Error('Enter a valid number.');
    return api.post('/configurations', editing);
  }, onSuccess: () => { clearConfigListCache(); setEditing(null); void client.invalidateQueries(); }, onError: showError });
  if (!allowed) return <Workflow title="Configuration"><Text>Configuration access required.</Text></Workflow>;
  const update = (key: keyof Configuration, value: string) => setEditing(current => current && ({ ...current, [key]: value }));
  return <Workflow title="Configuration" loading={query.isLoading} error={query.error} retry={() => void query.refetch()}>
    {editing ? <>
      <Field label="Key" value={editing.key} editable={isNew} onChangeText={v => update('key', v)} />
      <Field label="Category" value={editing.category} onChangeText={v => update('category', v)} />
      <Field label="Description" value={editing.description ?? ''} onChangeText={v => update('description', v)} />
      <SelectField label="Type" value={editing.type} onChange={v => update('type', v)} options={options(['STRING', 'NUMBER', 'CURRENCY', 'PERCENTAGE', 'BOOLEAN', 'JSON'])} />
      {editing.type === 'BOOLEAN' ? <SelectField label="Value" value={editing.value} onChange={v => update('value', v)} options={options(['true', 'false'])} /> :
        <Field label={editing.isConfigured ? 'New value (leave blank to keep stored credential)' : 'Value'} value={editing.value ?? ''} multiline={editing.type === 'JSON'} secureTextEntry={Boolean(editing.isConfigured)} onChangeText={v => update('value', v)} />}
      <Button title="Save" loading={mutation.isPending} onPress={() => mutation.mutate('save')} />
      {!isNew && <Button title="Delete configuration" variant="secondary" disabled={mutation.isPending} onPress={() => confirmAction('Delete configuration?', () => mutation.mutate('delete'))} />}
      <Button title="Cancel" variant="ghost" disabled={mutation.isPending} onPress={() => setEditing(null)} />
    </> : <>
      <Field label="Search configurations" value={search} onChangeText={setSearch} />
      <Button title="Add configuration" onPress={() => { setEditing({ ...empty }); setIsNew(true); }} />
      <Button title="Initialize defaults" variant="secondary" loading={mutation.isPending} onPress={() => confirmAction('Initialize default configurations?', () => mutation.mutate('init'))} />
      {Object.entries(query.data?.data ?? {}).map(([category, rows]) => <View key={category} style={{ gap: 12 }}><Text className="text-lg font-semibold">{category}</Text>
        {rows.filter(row => `${row.key} ${row.description}`.toLowerCase().includes(search.toLowerCase())).map(row => <View key={row.key} className="border border-gray-200 rounded-xl p-3" style={{ gap: 8 }}>
          <Text className="font-semibold">{row.key}</Text><Text>{row.description}</Text><Text>{row.isConfigured ? 'Configured' : row.value}</Text>
          <Button title="Edit" variant="secondary" onPress={() => { setEditing({ ...row, value: row.isConfigured ? '' : row.value }); setIsNew(false); }} />
        </View>)}
      </View>)}
    </>}
  </Workflow>;
}
