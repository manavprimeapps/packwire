import React, { useEffect, useState, useCallback } from 'react';
import {
  IndexTable,
  LegacyCard,
  useIndexResourceState,
  Text,
  Badge,
  Loading,
  Frame,
  useBreakpoints,
  Pagination,
  Button,
  ButtonGroup,
} from '@shopify/polaris';

import { DeleteIcon, EditIcon } from '@shopify/polaris-icons';

export const Tabledata = ({ boxdata, delete: deleteBox, edit: editBox }) => {
  const resourceName = {
    singular: 'box',
    plural: 'Box Collection',
  };
  const handleDelete = useCallback(
    (id) => {
      deleteBox(id);
    },
    [deleteBox],
  );
  const HandleEdit = useCallback(
    (id) => {
      editBox(id);
    },
    [editBox],
  );
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(boxdata);

  const rowMarkup = boxdata.map(
    (
      {
        _id,
        boxName,
        insidedimensions,
        outsidedimensions,
        flatdimensions,
        selectedItems,
        quantity,
        cost,
        weight,
        packagingtype,
        subtype,
        files,
      },
      index,
    ) => {
      return (
        <IndexTable.Row id={_id} key={_id} position={index}>
          <IndexTable.Cell>
            <Text
              variant="bodyMd"
              fontWeight="bold"
              as="span"
              // Add this if you want to indicate it's clickable
            >
              <a
                onClick={(e) => {
                  e.stopPropagation();
                  HandleEdit(_id);
                }}
                style={{ cursor: 'pointer' }}
              >
                {boxName}
              </a>
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{packagingtype ? `${packagingtype}` : `-`}</IndexTable.Cell>
          <IndexTable.Cell>{subtype ? `${subtype}` : `-`}</IndexTable.Cell>
          <IndexTable.Cell>
            {insidedimensions && insidedimensions.length > 0
              ? `${insidedimensions?.[0]?.Height} X ${insidedimensions?.[0]?.Width} X ${insidedimensions?.[0]?.Depth}`
              : '-'}
          </IndexTable.Cell>
          <IndexTable.Cell>
            {outsidedimensions && outsidedimensions.length > 0
              ? `${outsidedimensions?.[0]?.Height} X ${outsidedimensions?.[0]?.Width} X ${outsidedimensions?.[0]?.Depth}`
              : '-'}
          </IndexTable.Cell>
          <IndexTable.Cell>
            {flatdimensions && flatdimensions.length > 0
              ? `${flatdimensions[0].Height} X ${flatdimensions[0].Width}`
              : '-'}
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span">{quantity}</Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span">{weight}</Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span">{cost}</Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{selectedItems.productSelection.length}</IndexTable.Cell>
          <IndexTable.Cell>{selectedItems.collectionSelection.length}</IndexTable.Cell>
          <IndexTable.Cell>
            <ButtonGroup>
              <Button
                icon={DeleteIcon}
                variant="tertiary"
                tone="critical"
                onClick={() => handleDelete(_id)}
                accessibilityLabel="Delete"
              />
              <Button icon={EditIcon} variant="tertiary" onClick={() => HandleEdit(_id)} accessibilityLabel="Edit" />
            </ButtonGroup>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    },
  );

  return (
    <LegacyCard className="product-card-section">
      <IndexTable
        condensed={useBreakpoints().smDown}
        resourceName={resourceName}
        itemCount={boxdata.length}
        selectable={false}
        selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: 'Box Name' },
          { title: 'Packaging Type' },
          { title: 'Sub-Type' },
          { title: 'Insidedimensions' },
          { title: 'Outsidedimensions' },
          { title: 'Flatdimensions' },
          { title: 'Quantity' },
          { title: 'Weight(g)' },
          { title: 'Cost(US)' },
          { title: 'Product' },
          { title: 'Collection' },
          { title: 'Action' },
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );
};
