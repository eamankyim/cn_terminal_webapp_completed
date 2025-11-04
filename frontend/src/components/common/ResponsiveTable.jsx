import React from 'react';
import { Table, Card, Space, Typography } from 'antd';
import useResponsive from '../../hooks/useResponsive';
import './ResponsiveTable.css';

const { Text } = Typography;

/**
 * ResponsiveTable Component
 * 
 * Automatically switches between table view (desktop) and card view (mobile)
 * 
 * @param {Object} props
 * @param {Array} props.columns - Column definitions (standard Ant Design format)
 * @param {Array} props.dataSource - Table data
 * @param {string|Function} props.rowKey - Unique key for each row
 * @param {Object} props.mobileConfig - Mobile-specific configuration
 * @param {Array} props.mobileConfig.primaryFields - Essential fields to show on mobile card
 * @param {Array} props.mobileConfig.actionButtons - Custom action buttons (defaults to all actions)
 * @param {Function} props.onRowClick - Click handler to view full details (required for mobile cards)
 * @param {Object} props.scroll - Scroll configuration for table
 * @param {Object} props.pagination - Pagination configuration
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.locale - Table locale configuration
 */
const ResponsiveTable = ({
  columns,
  dataSource,
  rowKey,
  mobileConfig = {},
  onRowClick,
  scroll,
  pagination,
  loading,
  locale,
  ...restProps
}) => {
  const { isMobile } = useResponsive();

  // If not mobile, render standard table
  if (!isMobile) {
    return (
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        scroll={scroll}
        pagination={pagination}
        loading={loading}
        locale={locale}
        {...restProps}
      />
    );
  }

  // Mobile card view
  const {
    primaryFields = [],
    actionButtons = null
  } = mobileConfig;

  // Extract action column if it exists
  const actionsColumn = columns.find(col => col.key === 'actions' || col.title === 'Actions');
  
  // Get all data fields (non-action columns)
  const dataColumns = columns.filter(col => 
    col.key !== 'actions' && col.title !== 'Actions'
  );

  // Auto-detect primary fields if not provided
  const getPrimaryFields = () => {
    if (primaryFields.length > 0) return primaryFields;
    
    // Default: first 2-3 columns
    return dataColumns.slice(0, 3).map(col => col.key || col.dataIndex);
  };

  const mobilePrimaryFields = getPrimaryFields();

  // Render field value
  const renderFieldValue = (column, record) => {
    if (column.render) {
      // Get the actual value to pass to render function
      const value = column.dataIndex 
        ? record[column.dataIndex] 
        : record[column.key];
      return column.render(value, record, 0);
    }
    
    const value = column.dataIndex 
      ? record[column.dataIndex] 
      : record[column.key];
    
    return value || '-';
  };

  // Get field by key
  const getColumnByKey = (key) => {
    return dataColumns.find(col => 
      (col.key && col.key === key) || (col.dataIndex && col.dataIndex === key)
    );
  };

  return (
    <div className="responsive-table-mobile">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {dataSource.map((record, index) => {
          const key = typeof rowKey === 'function' ? rowKey(record) : record[rowKey];
          
          return (
            <Card 
              key={key || index}
              className="mobile-table-card"
              onClick={() => onRowClick && onRowClick(record)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {/* Primary Fields - Only Essential Info */}
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {mobilePrimaryFields.map((fieldKey, idx) => {
                  const column = getColumnByKey(fieldKey);
                  if (!column) return null;
                  
                  return (
                    <div key={idx} className="mobile-field">
                      <Text type="secondary" className="mobile-field-label">
                        {column.title}:
                      </Text>
                      <div className="mobile-field-value">
                        {renderFieldValue(column, record)}
                      </div>
                    </div>
                  );
                })}
              </Space>

              {/* Actions */}
              {actionsColumn && (
                <div className="mobile-actions">
                  {actionButtons 
                    ? actionButtons(record)
                    : renderFieldValue(actionsColumn, record)
                  }
                </div>
              )}
            </Card>
          );
        })}
      </Space>

      {/* Simple pagination info (if needed) */}
      {pagination && dataSource.length > 0 && (
        <div style={{ 
          marginTop: '16px', 
          textAlign: 'center',
          color: 'rgba(0, 0, 0, 0.45)'
        }}>
          {loading && <Text type="secondary">Loading...</Text>}
        </div>
      )}
    </div>
  );
};

export default ResponsiveTable;
