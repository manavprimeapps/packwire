import React, { useCallback } from 'react';
import { Button } from '@shopify/polaris';
import { ResourcePicker } from '@shopify/app-bridge/actions';
import { AppProvider, useAppBridge } from '@shopify/app-bridge-react';

export function ProductSelecter({ formData, setFormData, pickerType, resourceType, title }) {
  const app = useAppBridge();
  const host = new URLSearchParams(window.location.search).get('host');
  const handleSelection = useCallback(
    (selectionIds) => {
      setFormData((prevData) => ({
        ...prevData,
        selectedItems: {
          ...prevData.selectedItems,
          [pickerType]: selectionIds,
        },
      }));
    },
    [setFormData, pickerType],
  );

  const openPicker = () => {
    const selectedIds = Array.isArray(formData?.selectedItems?.[pickerType]) ? formData.selectedItems[pickerType] : [];

    // Log the selected IDs
    selectedIds.map((item) => console.log(item.id));

    // Create ResourcePicker with Product resource type
    const picker = ResourcePicker.create(app, {
      resourceType: ResourcePicker.ResourceType.Product, // Set it to Product to select products and variants
      options: {
        initialSelectionIds: selectedIds.map((item) => ({ id: `gid://shopify/${resourceType}/${item.id}` })),
      },
    });

    picker.subscribe(ResourcePicker.Action.SELECT, (resources) => {
      // Map through the selection to handle both products and variants
      const selectedItems = resources.selection.map((item) => {
        console.log(item?.variants[0]?.sku);
        // If no variants, handle it as a product
        return {
          id: item.id.split('/').pop(), // Get the product ID
          sku: item?.variants[0]?.sku, // Get the product SKU
          type: 'Product', // Indicate it's a product
        };
      });

      // Flatten the array in case variants are selected
      const flattenedSelection = selectedItems.flat();

      // Handle the selected items (flattenedSelection is an array of {id, sku, type})
      handleSelection(flattenedSelection);
    });

    picker.dispatch(ResourcePicker.Action.OPEN);
  };

  return (
    <div className="half-width-container">
      {title && (
        <label htmlFor={pickerType}>
          {pickerType === 'productSelection' ? 'Product Selection' : 'Collection Selection'}
        </label>
      )}
      <Button onClick={openPicker}>
        {pickerType === 'productSelection' ? 'Select Products' : 'Select Collections'}
      </Button>
    </div>
  );
}
