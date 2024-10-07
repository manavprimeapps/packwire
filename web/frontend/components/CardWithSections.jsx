import React, { useCallback } from 'react';
import { Grid } from '@shopify/polaris';
import { BlockStack, Button, ButtonGroup, Card, InlineGrid, Text } from '@shopify/polaris';
import { DeleteIcon, EditIcon } from '@shopify/polaris-icons';

export function CardWithSections({ boxdata, delete: deleteBox, edit: editBox }) {
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
  return (
    <div className="media-card-container">
      <Grid columns={{ xs: 1, sm: 2, lg: 3 }} gap="4">
        {boxdata.map((box, index) => (
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <BlockStack gap="200">
                <InlineGrid columns="1fr auto">
                  <Text as="h1" variant="headingSm">
                    Box Name : {box.boxName}
                  </Text>
                  <ButtonGroup>
                    <Button
                      icon={DeleteIcon}
                      variant="tertiary"
                      tone="critical"
                      onClick={() => handleDelete(box._id)}
                      accessibilityLabel="Delete"
                    />
                    <Button
                      icon={EditIcon}
                      variant="tertiary"
                      onClick={() => HandleEdit(box._id)}
                      accessibilityLabel="Edit"
                    />
                  </ButtonGroup>
                </InlineGrid>
              </BlockStack>
              <BlockStack gap="200">
                {box?.insidedimensions?.[0] ? (
                  <Text as="p" variant="bodyMd">
                    Insidedimensions : {box?.insidedimensions?.[0]?.Height} X {box?.insidedimensions?.[0]?.Width} X{' '}
                    {box?.insidedimensions?.[0]?.Depth}
                  </Text>
                ) : null}
                {box?.outsidedimensions?.[0] ? (
                  <Text as="p" variant="bodyMd">
                    Outsidedimensions : {box?.outsidedimensions?.[0]?.Height} X {box?.outsidedimensions?.[0]?.Width} X{' '}
                    {box?.outsidedimensions?.[0]?.Depth}
                  </Text>
                ) : null}
                {box?.flatdimensions?.[0] ? (
                  <Text as="p" variant="bodyMd">
                    Flatdimensions : {box?.flatdimensions?.[0]?.Height} X {box?.flatdimensions?.[0]?.Width}
                  </Text>
                ) : null}

                <Text as="p" variant="bodyMd">
                  Box Quantity : {box.quantity}
                </Text>
                <InlineGrid columns="1fr auto">
                  {box.selectedItems.productSelection.length ? (
                    <Text as="p" variant="bodyMd">
                      Total Product : {box.selectedItems.productSelection.length}
                    </Text>
                  ) : null}
                  {box.selectedItems.collectionSelection.length ? (
                    <Text as="p" variant="bodyMd">
                      Total Collection: {box.selectedItems.collectionSelection.length}
                    </Text>
                  ) : null}
                </InlineGrid>
              </BlockStack>
            </BlockStack>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
