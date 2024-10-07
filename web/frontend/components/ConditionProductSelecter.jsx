import React, { useCallback } from 'react';
import { Button } from '@shopify/polaris';
import { ResourcePicker } from '@shopify/app-bridge/actions';
import { useAppBridge } from '@shopify/app-bridge-react';

export function ConditionProductSelecter({ formData, setFormData, pickerType, resourceType, title = true }) {
  const app = useAppBridge();

  // Function to handle the product selection
  const handleSelection = useCallback(
    (selectionIds) => {
      setFormData(selectionIds);
    },
    [setFormData, pickerType],
  );

  // Function to open the Shopify ResourcePicker
  const openPicker = () => {
    const selectedIds = Array.isArray(formData?.[pickerType]) ? formData[pickerType] : [];

    // Create ResourcePicker for selecting products or collections
    const picker = ResourcePicker.create(app, {
      resourceType: ResourcePicker.ResourceType[resourceType], // Set the resource type (Product or Collection)
      options: {
        initialSelectionIds: selectedIds.map((item) => ({ id: `gid://shopify/${resourceType}/${item.id}` })),
      },
    });

    picker.subscribe(ResourcePicker.Action.SELECT, (resources) => {
      // Map through the selection and handle products or variants

      const selectedItems = resources.selection.map((item) => ({
        id: item.id.split('/').pop(),
        title: item.title,
        Img_Src: item.images?.[0]?.originalSrc, // Extract product or collection ID
        sku: item?.variants?.[0]?.sku || null, // Handle products with variants
      }));

      // Update the formData for the selected items
      handleSelection(selectedItems);
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
