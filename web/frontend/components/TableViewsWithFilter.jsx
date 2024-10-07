import { TextField, IndexTable, LegacyCard, useIndexResourceState, Badge } from '@shopify/polaris';
// import type { IndexFiltersProps, TabProps } from '@shopify/polaris';
import { useState, useCallback } from 'react';

export function TableViewsWithFilter({ HistoryData }) {
  const resourceName = {
    singular: 'order',
    plural: 'orders',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(HistoryData);

  const rowMarkup = HistoryData.map(
    ({ order_Name, boxName, ProductName, createdAt, quantity, order_status }, index) => {
      // Convert the `createdAt` date string to the desired format
      const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      return (
        <IndexTable.Row key={index}>
          <IndexTable.Cell>{order_Name}</IndexTable.Cell>
          <IndexTable.Cell>{formattedDate}</IndexTable.Cell>
          <IndexTable.Cell>{boxName}</IndexTable.Cell>
          <IndexTable.Cell>{ProductName ? ProductName : '-'}</IndexTable.Cell>
          <IndexTable.Cell>{quantity}</IndexTable.Cell>
          <IndexTable.Cell>
            {order_status === 'created' ? (
              <Badge tone="success">Completed</Badge>
            ) : (
              <Badge tone="warning">Canceled</Badge>
            )}
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    },
  );

  return (
    <LegacyCard>
      <IndexTable
        resourceName={resourceName}
        itemCount={HistoryData.length}
        selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: 'Order' },
          { title: 'Date' },
          { title: 'Box Name' },
          { title: 'Product Name' },
          { title: 'Quantity' },
          { title: 'Status' },
        ]}
        selectable={false}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );
}
