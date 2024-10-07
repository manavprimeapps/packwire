import { Grid, LegacyCard } from '@shopify/polaris';
import { useState, useCallback } from 'react';

export function GridCell({
  ordercount,
  title,
  CompletedOrderGridCell,
  CancelOrderGridCell,
  UseBoxGridCell,
  MostuseGridCell,
  useboxdata,
}) {
  return (
    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3 }}>
      <LegacyCard title={title} sectioned>
        <p>
          {CompletedOrderGridCell && ordercount}
          {CancelOrderGridCell && ordercount}
          {UseBoxGridCell && ordercount}
          {MostuseGridCell && ordercount}
          {useboxdata && ordercount}
        </p>
      </LegacyCard>
    </Grid.Cell>
  );
}
