import { LegacyCard, ResourceList, ResourceItem, Avatar, Text, InlineGrid } from '@shopify/polaris';
import React from 'react';

export function ResourceItems({ formData, ShopName }) {
  console.log(formData);
  return (
    <ResourceList
      resourceName={{ singular: 'customer', plural: 'customers' }}
      items={formData?.productSelection}
      renderItem={(item) => {
        const { id, title, Img_Src } = item;
        const Producturl = `https://admin.shopify.com/store/${ShopName}/products/${id}`;
        return (
          <ResourceItem
            id={id}
            url={Producturl}
            media={<Avatar customer size="md" name={title} source={Img_Src} />}
            name={title}
          >
            <Text variant="bodyMd" as="h4">
              {title}
            </Text>
          </ResourceItem>
        );
      }}
    />
  );
}
