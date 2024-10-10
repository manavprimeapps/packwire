import {
  IndexTable,
  LegacyCard,
  IndexFilters,
  useSetIndexFiltersMode,
  Text,
  IndexFiltersMode,
  useIndexResourceState,
  Button,
  Pagination,
  ChoiceList,
  ButtonGroup,
} from '@shopify/polaris';
import { useState, useCallback, useEffect } from 'react';
import { DeleteIcon, EditIcon } from '@shopify/polaris-icons';

export function SearchTable({ boxdata, delete: deleteBox, edit: editBox }) {
  const [itemStrings, setItemStrings] = useState(['All']);
  const [queryValue, setQueryValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortSelected, setSortSelected] = useState(['quantity asc']);
  const [packagingType, setPackagingType] = useState([]);

  const handlePackagingTypeChange = useCallback((value) => setPackagingType(value), []);

  const tabs = itemStrings.map((item, index) => ({
    content: item,
    index,
    id: `${item}-${index}`,
    isLocked: index === 0,
  }));

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

  const currentSort = sortSelected[0];

  const sortedOrders = [...boxdata].sort((a, b) => {
    switch (currentSort) {
      case 'quantity asc':
        return a.quantity - b.quantity;
      case 'quantity desc':
        return b.quantity - a.quantity;
      case 'box asc':
        return a.boxName.localeCompare(b.boxName);
      case 'box desc':
        return b.boxName.localeCompare(a.boxName);
      case 'weight asc':
        return a.weight - b.weight;
      case 'weight desc':
        return b.weight - a.weight;
      case 'cost asc':
        return a.cost - b.cost;
      case 'cost desc':
        return b.cost - a.cost;
      default:
        return 0;
    }
  });

  const filteredOrders = sortedOrders.filter(({ boxName, packagingtype, subtype }) => {
    const queryMatch = boxName.toLowerCase().includes(queryValue.toLowerCase());
    const packagingTypeMatch = packagingType.length === 0 || packagingType.includes(packagingtype.toLowerCase());
    const SubTypeMatch = packagingType.length === 0 || packagingType.includes(subtype.toLowerCase());
    return queryMatch && (packagingTypeMatch || SubTypeMatch);
  });

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(paginatedOrders, {
    resourceIDResolver: (box) => box._id,
  });

  const rowMarkup = paginatedOrders.map(
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
      },
      index,
    ) => {
      return (
        <IndexTable.Row id={_id} key={_id} selected={selectedResources.includes(_id)} position={index}>
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold" as="span">
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
          <IndexTable.Cell>{packagingtype ? `${packagingtype}` : '-'}</IndexTable.Cell>
          <IndexTable.Cell>{subtype ? `${subtype}` : '-'}</IndexTable.Cell>
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

  const PackagingType = [];
  const SubType = [];
  let Types = [];

  // Populate PackagingType and SubType arrays
  boxdata.forEach(({ packagingtype, subtype }) => {
    PackagingType.push(packagingtype);
    SubType.push(subtype);
  });

  // Merge arrays and remove duplicates
  Types = [...new Set([...PackagingType, ...SubType])];

  // Filters configuration
  const filters = [
    {
      key: 'packagingtype',
      label: 'Packaging Type',
      filter: (
        <ChoiceList
          title="Packaging Type"
          titleHidden
          choices={Types.map((type) => ({ label: type, value: type.toLowerCase() }))}
          selected={packagingType || []}
          onChange={handlePackagingTypeChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const sortOptions = [
    { label: 'Quantity', value: 'quantity asc', directionLabel: 'Ascending' },
    { label: 'Quantity', value: 'quantity desc', directionLabel: 'Descending' },
    { label: 'Box Name', value: 'box asc', directionLabel: 'A-Z' },
    { label: 'Box Name', value: 'box desc', directionLabel: 'Z-A' },
    { label: 'Weight', value: 'weight asc', directionLabel: 'Ascending' },
    { label: 'Weight', value: 'weight desc', directionLabel: 'Descending' },
    { label: 'Cost', value: 'cost asc', directionLabel: 'Ascending' },
    { label: 'Cost', value: 'cost desc', directionLabel: 'Descending' },
  ];

  const { mode, setMode } = useSetIndexFiltersMode(IndexFiltersMode.Filtering);

  const handleQueryValueChange = useCallback((value) => setQueryValue(value), []);

  const promotedActions = [
    {
      content: 'Delete Selected',
      onAction: async () => {
        for (const id of selectedResources) {
          await handleDelete(id);
        }
      },
    },
    {
      content: 'Delete All',
      onAction: async () => {
        for (const order of paginatedOrders) {
          await handleDelete(order._id);
        }
      },
    },
  ];

  return (
    <LegacyCard>
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Searching in all"
        onQueryChange={handleQueryValueChange}
        onQueryClear={() => setQueryValue('')}
        tabs={tabs}
        filters={filters}
        mode={mode}
        onSort={setSortSelected}
      />
      <IndexTable
        resourceName={resourceName}
        itemCount={filteredOrders.length}
        selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        promotedBulkActions={promotedActions}
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
      <Pagination
        hasPrevious={currentPage > 1}
        hasNext={currentPage < Math.ceil(filteredOrders.length / itemsPerPage)}
        onPrevious={() => setCurrentPage(currentPage - 1)}
        onNext={() => setCurrentPage(currentPage + 1)}
      />
    </LegacyCard>
  );
}
