import React, { useState } from 'react';
import { Share, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import { Workflow, Field, showError } from '../../components/Workflow';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { UI_PERMISSIONS } from '../../utils/permissions';

const reports = [
  ['summary', 'Summary'], ['job-status', 'Jobs by status'], ['daily-activity', 'Daily activity'],
  ['revenue', 'Revenue'], ['invoices', 'Invoices'], ['customers', 'Customer activity'],
  ['processing-time', 'Processing time'], ['monthly-trends', 'Monthly trends'],
  ['assignee-work', 'Assignee work'], ['stage-times', 'Stage times'],
].map(([value, label]) => ({ value, label }));
const label = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');

function ReportValues({ value }: { value: unknown }) {
  if (value == null) return <Text>—</Text>;
  if (Array.isArray(value)) return value.length ? <View style={{ gap: 12 }}>{value.map((row, i) => <View key={i} className="border border-gray-200 rounded-xl p-3"><ReportValues value={row} /></View>)}</View> : <Text>No results for this period.</Text>;
  if (typeof value === 'object') return <View style={{ gap: 8 }}>{Object.entries(value).map(([key, item]) => <View key={key}><Text className="text-gray-500">{label(key)}</Text><ReportValues value={item} /></View>)}</View>;
  return <Text className="text-base">{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value)}</Text>;
}
export function ReportsScreen() {
  const { hasPermission } = useAuth();
  const allowed = hasPermission(UI_PERMISSIONS.REPORTS);
  const [report, setReport] = useState('summary');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [assigneeId, setAssigneeId] = useState('');
  const [range, setRange] = useState({ startDate, endDate });
  const assigneeReport = ['assignee-work', 'stage-times'].includes(report);
  const people = useQuery({ queryKey: ['report-assignees'], queryFn: () => api.get<{ users: { id: string; name: string }[] }>('/auth/assignable-users'), enabled: allowed && assigneeReport });
  const query = useQuery({ queryKey: ['reports', report, range, assigneeReport ? assigneeId : ''], queryFn: () => api.get<unknown>(`/reports/${report}?startDate=${range.startDate}&endDate=${range.endDate}${assigneeReport && assigneeId ? `&assigneeId=${encodeURIComponent(assigneeId)}` : ''}`), enabled: allowed });
  return <Workflow title="Reports">
    {!allowed ? <Text>Reports access required.</Text> : <>
      <SelectField label="Report" value={report} onChange={setReport} options={reports} />
      <Field label="From (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
      <Field label="To (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
      <Button title="Apply dates" onPress={() => {
        if (![startDate, endDate].every(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d))) || startDate > endDate) { showError(new Error('Enter a valid date range.')); return; }
        setRange({ startDate, endDate });
      }} />
      {assigneeReport && <SelectField label="Assignee" value={assigneeId} onChange={setAssigneeId} options={[{ value: '', label: 'All assignees' }, ...(people.data?.users ?? []).map(p => ({ value: p.id, label: p.name }))]} />}
      <Text>{range.startDate} to {range.endDate}</Text>
      {query.isLoading ? <Text>Loading report…</Text> : query.error ? <><Text className="text-red-700">{query.error.message}</Text><Button title="Retry" onPress={() => void query.refetch()} /></> : <ReportValues value={query.data} />}
      {query.data != null && hasPermission(UI_PERMISSIONS.EXPORT_REPORTS) && <Button title="Share report data" variant="secondary" onPress={() => { void Share.share({ title: `${report} report`, message: `${reports.find(r => r.value === report)?.label}\n${range.startDate} to ${range.endDate}\n${JSON.stringify(query.data, null, 2)}` }).catch(showError); }} />}
    </>}
  </Workflow>;
}
