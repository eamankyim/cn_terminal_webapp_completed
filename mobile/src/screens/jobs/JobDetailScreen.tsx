import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/http';
import { StatusBadge } from '../../components/StatusBadge';
import type { Job } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import { getEtaTextColor, getEtaUrgency } from '../../utils/etaUrgency';

interface JobDetailResponse {
  job: Job & {
    description?: string;
    jobDescription?: string;
    submittedDate?: string | null;
    goodsTypes?: string[];
    customer?: Job['customer'] & {
      email?: string;
      phone?: string;
      ghanaCard?: string | null;
      tin?: string | null;
    };
    consignment?: {
      id: string;
      trackingId: string;
      consigneeName?: string;
      consigneePhone?: string;
      ghanaCard?: string | null;
      tin?: string | null;
    };
    createdBy?: { id: string; name: string };
  };
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** e.g. 2026-07-28 23:49:14 */
function formatSubmittedDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/** e.g. 31/07/2026 */
function formatEta(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const datePart = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [y, m, day] = datePart.split('-');
      return `${day}/${m}/${y}`;
    }
    return value;
  }
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatStatusLabel(status?: string): string {
  if (!status) return '—';
  return status.replace(/_/g, ' ');
}

type OverviewRow = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
};

type InfoRow = {
  key: string;
  label: string;
  value: string;
};

export type JobDetailContentProps = {
  jobId: string;
  onClose: () => void;
  onNavigate: (screen: string, params?: { jobId: string; currentStatus?: string }) => void;
  /** Sheet mode skips top safe-area (parent sheet handles chrome). */
  presentation?: 'sheet' | 'screen';
};

export const JobDetailContent: React.FC<JobDetailContentProps> = ({
  jobId,
  onClose,
  onNavigate,
  presentation = 'screen',
}) => {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const isSheet = presentation === 'sheet';
  const { hasPermission } = useAuth();
  const canEditJob = hasPermission(PERMISSIONS.JOB_EDIT);
  const canUpdateStatus = hasPermission(PERMISSIONS.JOB_UPDATE_STATUS);
  const canAssignJob = hasPermission(PERMISSIONS.JOB_ASSIGN);

  const { data, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.get<JobDetailResponse>(`/jobs/${jobId}`),
    enabled: Boolean(jobId),
  });

  if (isLoading || !data?.job) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3 text-base">Loading job…</Text>
      </View>
    );
  }

  const job = data.job;
  const customer = job.customer;
  const consignment = job.consignment;
  const goodsTypes = job.goodsTypes ?? [];

  const overviewRows: OverviewRow[] = [
    {
      key: 'createdBy',
      icon: 'person-outline',
      label: 'Created By',
      value: job.createdBy?.name ?? '—',
    },
    {
      key: 'assignedTo',
      icon: 'person-outline',
      label: 'Assigned To',
      value: job.assignedTo?.name ?? '—',
    },
    {
      key: 'submitted',
      icon: 'calendar-outline',
      label: 'Submitted Date',
      value: formatSubmittedDate(job.submittedDate ?? job.createdAt),
    },
    {
      key: 'eta',
      icon: 'time-outline',
      label: 'ETA',
      value: formatEta(job.eta),
      valueColor:
        getEtaUrgency(job.eta) === 'critical' || getEtaUrgency(job.eta) === 'warning'
          ? getEtaTextColor(job.eta)
          : undefined,
    },
  ];

  const clientRows: InfoRow[] = [
    { key: 'name', label: 'Name', value: customer?.name ?? '—' },
    { key: 'email', label: 'Email', value: customer?.email ?? '—' },
    { key: 'phone', label: 'Phone', value: customer?.phone ?? '—' },
    {
      key: 'ghanaCard',
      label: 'Ghana Card',
      value: customer?.ghanaCard || consignment?.ghanaCard || '—',
    },
    {
      key: 'tin',
      label: 'TIN',
      value: customer?.tin || consignment?.tin || '—',
    },
  ];

  const jobInfoRows: InfoRow[] = [
    {
      key: 'consignment',
      label: 'Consignment',
      value: consignment?.trackingId ?? '—',
    },
    {
      key: 'consignee',
      label: 'Consignee',
      value: consignment?.consigneeName ?? '—',
    },
    {
      key: 'consigneePhone',
      label: 'Consignee Phone',
      value: consignment?.consigneePhone ?? '—',
    },
    {
      key: 'shipperName',
      label: 'Shipper Name',
      value: job.shipperName ?? '—',
    },
    {
      key: 'invoiceNumber',
      label: 'Invoice Number',
      value: job.invoiceNumber ?? '—',
    },
    {
      key: 'boeNumber',
      label: 'BoE Number',
      value: job.boeNumber ?? '—',
    },
    {
      key: 'terminalName',
      label: 'Terminal',
      value: job.terminalName ?? '—',
    },
    {
      key: 'driverName',
      label: 'Driver',
      value: job.driverName ?? '—',
    },
    {
      key: 'driverContact',
      label: 'Driver Contact',
      value: job.driverContact ?? '—',
    },
  ];

  const openAction = (screen: string) => {
    setMenuOpen(false);
    onNavigate(screen, { jobId, currentStatus: job.status });
  };

  return (
    <View
      className="flex-1 bg-white"
      style={isSheet ? undefined : { paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={isSheet ? 'Close' : 'Go back'}
          className="w-10 items-start"
        >
          <Ionicons
            name={isSheet ? 'close' : 'chevron-back'}
            size={26}
            color="#000"
          />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black">Job Details.</Text>
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="More actions"
          className="w-10 items-end"
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: isSheet ? 24 : insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <Text className="text-4xl font-bold text-black mt-1 tracking-tight">
          {job.trackingId}
        </Text>
        <View className="flex-row items-center mt-3 mb-5" style={{ gap: 8 }}>
          <StatusBadge
            label={formatStatusLabel(job.status)}
            variant="outline"
            size="md"
            uppercase
          />
          {job.isDraft ? (
            <StatusBadge
              label="Draft"
              variant="outlineMuted"
              size="md"
              uppercase
            />
          ) : null}
        </View>

        <View className="h-px bg-gray-200 mb-5" />

        {/* Job Overview */}
        <Text className="text-lg font-bold text-black mb-3">Job Overview</Text>
        <View className="mb-5">
          {overviewRows.map((row) => (
            <View key={row.key} className="flex-row items-center py-3">
              <Ionicons name={row.icon} size={20} color="#000" />
              <Text className="text-base text-black ml-2.5 flex-shrink-0">
                {row.label}
              </Text>
              <Text
                className="text-base text-right flex-1 ml-3"
                style={{ color: row.valueColor ?? '#000' }}
                numberOfLines={2}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View className="h-px bg-gray-200 mb-5" />

        {/* Client Information */}
        <Text className="text-lg font-bold text-black mb-3">
          Client Information
        </Text>
        <View className="mb-5">
          {clientRows.map((row) => (
            <View key={row.key} className="flex-row items-start py-2.5">
              <Text className="text-base text-black w-[38%] pr-2">{row.label}</Text>
              <Text className="text-base text-black flex-1" selectable>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View className="h-px bg-gray-200 mb-5" />

        {/* Job Information */}
        <Text className="text-lg font-bold text-black mb-3">
          Job Information
        </Text>
        <View>
          {jobInfoRows.map((row) => (
            <View key={row.key} className="flex-row items-start py-2.5">
              <Text className="text-base text-black w-[38%] pr-2">{row.label}</Text>
              <Text className="text-base text-black flex-1" selectable>
                {row.value}
              </Text>
            </View>
          ))}
          <View className="flex-row items-start py-2.5">
            <Text className="text-base text-black w-[38%] pr-2 pt-1">
              Goods Types
            </Text>
            <View className="flex-1 flex-row flex-wrap" style={{ gap: 8 }}>
              {goodsTypes.length === 0 ? (
                <Text className="text-base text-black">—</Text>
              ) : (
                goodsTypes.map((type) => (
                  <View
                    key={type}
                    className="border border-black px-2.5 py-1.5 rounded-full"
                  >
                    <Text className="text-sm text-black">{type}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Overflow menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View className="flex-1">
          <Pressable
            className="absolute inset-0"
            onPress={() => setMenuOpen(false)}
          />
          <View
            className="absolute right-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
            style={{ top: isSheet ? 56 : insets.top + 48, minWidth: 180 }}
          >
            {canEditJob ? (
              <TouchableOpacity
                onPress={() => openAction('JobEdit')}
                className="px-4 py-3.5 border-b border-gray-100"
                activeOpacity={0.7}
              >
                <Text className="text-base text-black">Edit job</Text>
              </TouchableOpacity>
            ) : null}
            {canAssignJob ? (
              <TouchableOpacity
                onPress={() => openAction('JobReassign')}
                className="px-4 py-3.5 border-b border-gray-100"
                activeOpacity={0.7}
              >
                <Text className="text-base text-black">Reassign</Text>
              </TouchableOpacity>
            ) : null}
            {canUpdateStatus ? (
              <TouchableOpacity
                onPress={() => openAction('JobStatusUpdate')}
                className="px-4 py-3.5 border-b border-gray-100"
                activeOpacity={0.7}
              >
                <Text className="text-base text-black">Update status</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => openAction('JobComments')}
              className="px-4 py-3.5"
              activeOpacity={0.7}
            >
              <Text className="text-base text-black">View comments</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/** Full-screen stack route (deep links / create → detail). */
export const JobDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const jobId: string = route.params?.jobId;

  return (
    <JobDetailContent
      jobId={jobId}
      presentation="screen"
      onClose={() => navigation.goBack()}
      onNavigate={(screen, params) => navigation.navigate(screen, params)}
    />
  );
};
