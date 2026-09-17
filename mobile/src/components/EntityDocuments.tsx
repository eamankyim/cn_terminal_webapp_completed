import React from 'react';
import { Linking, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/http';
import { API_BASE_URL } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../utils/permissions';
import { Button } from './Button';
import { confirmAction, showError } from './Workflow';

type Document = { id: string; originalName: string; url: string; name?: string; category?: string | null };

const JOB_DOCUMENT_SECTIONS: { category: string; title: string }[] = [
  { category: 'payment_receipt', title: 'Payment Receipts (Compulsory)' },
  { category: 'demurrage_invoice', title: 'Demurrage Invoices' },
];

export function EntityDocuments({ entityType, entityId }: { entityType: 'job' | 'consignment'; entityId: string }) {
  const { hasPermission } = useAuth();
  const client = useQueryClient();
  const key = ['documents', entityType, entityId];
  const query = useQuery({ queryKey: key, queryFn: () => api.get<{ files: Document[] }>(`/files/entity/${entityType}/${encodeURIComponent(entityId)}`) });
  const upload = useMutation({ mutationFn: async () => {
    if (!hasPermission(PERMISSIONS.FILE_UPLOAD)) throw new Error('Upload access required.');
    const picked = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (picked.canceled) return;
    for (const file of picked.assets) {
      const body = new FormData();
      body.append('folder', entityType === 'job' ? 'jobs' : 'consignments');
      body.append('category', `${entityType}_document`);
      body.append('entityType', entityType);
      body.append('entityId', entityId);
      body.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' } as any);
      await api.post('/files/upload', body);
      await client.invalidateQueries({ queryKey: key });
    }
  }, onError: showError });
  const remove = useMutation({ mutationFn: (url: string) => {
    if (!hasPermission(PERMISSIONS.FILE_DELETE)) throw new Error('Delete access required.');
    return api.delete('/files/delete', { body: JSON.stringify({ fileUrl: url }) });
  }, onSuccess: () => { void client.invalidateQueries({ queryKey: key }); }, onError: showError });

  const renderDoc = (file: Document) => (
    <View key={file.id} className="border border-gray-200 rounded-xl p-3" style={{ gap: 8 }}>
      <Text>{file.originalName || file.name || 'Document'}</Text>
      {hasPermission(PERMISSIONS.FILE_DOWNLOAD) && <Button title="Open document" variant="secondary" onPress={() => {
        const url = new URL(file.url, `${API_BASE_URL.replace(/\/api\/?$/, '')}/`).href;
        if (!/^https?:\/\//i.test(url)) { showError(new Error('Invalid document URL.')); return; }
        void Linking.openURL(url).catch(showError);
      }} />}
      {hasPermission(PERMISSIONS.FILE_DELETE) && <Button title="Delete document" variant="ghost" disabled={remove.isPending} onPress={() => confirmAction('Delete document?', () => remove.mutate(file.url))} />}
    </View>
  );

  const files = query.data?.files ?? [];
  const groupedSections =
    entityType === 'job'
      ? JOB_DOCUMENT_SECTIONS.map((section) => ({
          title: section.title,
          docs: files.filter((f) => f.category === section.category),
        })).filter((section) => section.docs.length > 0)
      : [];
  const groupedCategories = new Set(JOB_DOCUMENT_SECTIONS.map((s) => s.category));
  const otherDocs =
    entityType === 'job'
      ? files.filter((f) => !groupedCategories.has(f.category ?? ''))
      : files;

  return <View style={{ gap: 10, marginVertical: 16 }}><Text className="text-lg font-semibold">Documents</Text>
    {query.isLoading && <Text>Loading documents…</Text>}
    {query.error && <><Text className="text-red-700">{query.error.message}</Text><Button title="Retry documents" variant="secondary" onPress={() => void query.refetch()} /></>}
    {groupedSections.map((section) => (
      <View key={section.title} style={{ gap: 8 }}>
        <Text className="text-sm font-semibold text-gray-600">{section.title}</Text>
        {section.docs.map(renderDoc)}
      </View>
    ))}
    {groupedSections.length > 0 && otherDocs.length > 0 ? (
      <Text className="text-sm font-semibold text-gray-600">Other Documents</Text>
    ) : null}
    {otherDocs.map(renderDoc)}
    {files.length === 0 && !query.isLoading && <Text>No documents attached.</Text>}
    {hasPermission(PERMISSIONS.FILE_UPLOAD) && <Button title="Upload documents" loading={upload.isPending} onPress={() => upload.mutate()} />}
  </View>;
}
