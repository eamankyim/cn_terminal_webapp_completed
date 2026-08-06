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
import type { Consignment, Customer } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PERMISSIONS } from '../../utils/permissions';

type DetailTab = 'details' | 'consignees';

interface CustomerDetailResponse {
  customer: Customer & {
    address?: string;
    contactPerson?: string | null;
    ghanaCard?: string | null;
    tin?: string | null;
    customerType?: string | null;
    status?: string | null;
    updatedAt?: string | null;
    createdAt?: string | null;
    consignments?: Consignment[];
    jobs?: Array<{ id: string; updatedAt?: string; createdAt?: string }>;
  };
}

type InfoRow = {
  key: string;
  label: string;
  value: string;
};

function displayValue(value?: string | null, empty = '—'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : empty;
}

function formatStatusLabel(status?: string | null): string {
  if (!status) return 'Active';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatActivityDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function deriveLastActivity(
  customer: CustomerDetailResponse['customer'],
): string {
  const candidates: string[] = [];
  for (const job of customer.jobs ?? []) {
    if (job.updatedAt) candidates.push(job.updatedAt);
    if (job.createdAt) candidates.push(job.createdAt);
  }
  for (const consignment of customer.consignments ?? []) {
    if (consignment.date) candidates.push(consignment.date);
  }
  if (candidates.length === 0) return 'N/A';
  const latest = candidates
    .map((v) => new Date(v).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a)[0];
  if (latest == null) return 'N/A';
  return formatActivityDate(new Date(latest).toISOString()) ?? 'N/A';
}

export type CustomerDetailContentProps = {
  customerId: string;
  onClose: () => void;
  onNavigate: (screen: string, params?: Record<string, string>) => void;
  presentation?: 'sheet' | 'screen';
};

export const CustomerDetailContent: React.FC<CustomerDetailContentProps> = ({
  customerId,
  onClose,
  onNavigate,
  presentation = 'screen',
}) => {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('details');
  const isSheet = presentation === 'sheet';
  const { hasPermission } = useAuth();
  const { accent } = useTheme();
  const canEditCustomer = hasPermission(PERMISSIONS.CUSTOMER_EDIT);
  const canCreateCustomer = hasPermission(PERMISSIONS.CUSTOMER_CREATE);

  const { data, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () =>
      api.get<CustomerDetailResponse>(`/customers/${customerId}`),
    enabled: Boolean(customerId),
  });

  if (isLoading || !data?.customer) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3 text-base">Loading client…</Text>
      </View>
    );
  }

  const customer = data.customer;
  const consignments = customer.consignments ?? [];
  const isActive = (customer.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE';

  const contactRows: InfoRow[] = [
    {
      key: 'contactPerson',
      label: 'Contact Person:',
      value: displayValue(customer.contactPerson, 'N/A'),
    },
    {
      key: 'email',
      label: 'Email:',
      value: displayValue(customer.email),
    },
    {
      key: 'phone',
      label: 'Phone:',
      value: displayValue(customer.phone),
    },
    {
      key: 'address',
      label: 'Address:',
      value: displayValue(customer.address),
    },
    {
      key: 'ghanaCard',
      label: 'Ghana Card:',
      value: displayValue(customer.ghanaCard),
    },
    {
      key: 'lastActivity',
      label: 'Last Activity:',
      value: deriveLastActivity(customer),
    },
  ];

  const businessRows: InfoRow[] = [
    {
      key: 'tin',
      label: 'TIN:',
      value: displayValue(customer.tin),
    },
    {
      key: 'clientType',
      label: 'Client Type:',
      value: displayValue(customer.customerType, 'N/A'),
    },
  ];

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
        <Text className="text-lg font-semibold text-black">Client Details</Text>
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
          {customer.name}
        </Text>
        <StatusBadge
          label={formatStatusLabel(customer.status)}
          variant="muted"
          size="md"
          showDot
          dotColor={isActive ? '#111111' : '#9CA3AF'}
          className="mt-3 mb-5"
        />

        {/* Tabs */}
        <View className="flex-row border-b border-gray-200">
          {(
            [
              { key: 'details', label: 'Details' },
              { key: 'consignees', label: 'Consignees' },
            ] as const
          ).map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="mr-6 pb-3"
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <Text
                  className={`text-base ${
                    selected
                      ? 'font-semibold text-black'
                      : 'font-medium text-gray-400'
                  }`}
                >
                  {tab.label}
                </Text>
                {selected ? (
                  <View
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: 2.5, backgroundColor: accent }}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'details' ? (
          <View className="mt-6">
            <Text className="text-lg font-bold text-black mb-1">
              Contact Information
            </Text>
            <View className="mb-6">
              {contactRows.map((row, index) => (
                <View
                  key={row.key}
                  className={`flex-row items-start py-3.5 ${
                    index < contactRows.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <Text className="text-base text-gray-700 flex-shrink-0 pr-3">
                    {row.label}
                  </Text>
                  <Text
                    className="text-base text-black text-right flex-1"
                    selectable
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="text-lg font-bold text-black mb-1">
              Business Information
            </Text>
            <View>
              {businessRows.map((row, index) => (
                <View
                  key={row.key}
                  className={`flex-row items-start py-3.5 ${
                    index < businessRows.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <Text className="text-base text-gray-700 flex-shrink-0 pr-3">
                    {row.label}
                  </Text>
                  <Text
                    className="text-base text-black text-right flex-1"
                    selectable
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="mt-6">
            {consignments.length === 0 ? (
              <Text className="text-base text-gray-500">
                No consignees recorded for this client yet.
              </Text>
            ) : (
              consignments.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() =>
                    onNavigate('ConsignmentDetail', {
                      consignmentId: item.id,
                    })
                  }
                  activeOpacity={0.7}
                  className={`py-3.5 ${
                    index < consignments.length - 1
                      ? 'border-b border-gray-200'
                      : ''
                  }`}
                >
                  <Text className="text-base font-semibold text-black">
                    {item.consigneeName ?? 'Consignee'}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {item.consigneePhone || '—'}
                    {item.trackingId ? ` · ${item.trackingId}` : ''}
                  </Text>
                  {item.consigneeAddress ? (
                    <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={2}>
                      {item.consigneeAddress}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
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
            {canEditCustomer ? (
              <TouchableOpacity
                onPress={() => {
                  setMenuOpen(false);
                  onNavigate('CustomerEdit', { customerId });
                }}
                className="px-4 py-3.5 border-b border-gray-100"
                activeOpacity={0.7}
              >
                <Text className="text-base text-black">Edit client</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                setActiveTab('consignees');
              }}
              className="px-4 py-3.5 border-b border-gray-100"
              activeOpacity={0.7}
            >
              <Text className="text-base text-black">View consignees</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                onNavigate('ConsignmentsList', { customerId });
              }}
              className="px-4 py-3.5 border-b border-gray-100"
              activeOpacity={0.7}
            >
              <Text className="text-base text-black">Manage consignments</Text>
            </TouchableOpacity>
            {canCreateCustomer ? (
              <TouchableOpacity
                onPress={() => {
                  setMenuOpen(false);
                  onNavigate('ConsignmentCreate', { customerId });
                }}
                className="px-4 py-3.5"
                activeOpacity={0.7}
              >
                <Text className="text-base text-black">Add consignee</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

/** Full-screen stack route (deep links / create → detail). */
export const CustomerDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const customerId: string = route.params?.customerId;

  return (
    <CustomerDetailContent
      customerId={customerId}
      presentation="screen"
      onClose={() => navigation.goBack()}
      onNavigate={(screen, params) => navigation.navigate(screen, params)}
    />
  );
};
