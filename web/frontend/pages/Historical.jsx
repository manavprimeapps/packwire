import React, { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../hooks';
import { Page, Frame, Layout, LegacyCard, Grid } from '@shopify/polaris';
import { DateRangePicker, GridCell, TableViewsWithFilter } from '../components';

function Historical() {
  const fetch = useAuthenticatedFetch();
  const [SelectedDate, setSelectedDate] = useState([]);
  const [HistoryData, setHistoryData] = useState([]);
  const [CompletedOrderData, setCompletedOrderData] = useState('');
  const [CancelOrderData, setCancelOrderData] = useState('');
  const [UseboxCount, setUseboxCount] = useState('');
  const [MostUsebox, setMostUsebox] = useState('');
  const [useboxdata, setuseboxdata] = useState([]);

  useEffect(() => {
    fetchHistoricalData();
  }, [SelectedDate]);
  console.log(SelectedDate);

  async function fetchHistoricalData() {
    try {
      // Prepare the body data, sending an empty object if no date is selected
      const bodyData = SelectedDate ? JSON.stringify({ date: SelectedDate }) : JSON.stringify({});

      let request = await fetch('/api/Historicaldata/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyData, // Send the date as a JSON string
      });

      let response = await request.json();

      if (response.success) {
        setHistoryData(response.response);
        setCompletedOrderData(response.completed);
        setCancelOrderData(response.cancel);
        setUseboxCount(response.totalQuantity);
        setMostUsebox(response.mostUsedBox.name);
        setuseboxdata(response.boxUsageArray);
      }
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  }

  return (
    <Frame>
      <Page fullWidth>
        <Grid>
          <GridCell ordercount={UseboxCount} title="Use box" UseBoxGridCell />
          <GridCell ordercount={CompletedOrderData} title="Completed Order" CompletedOrderGridCell />
          <GridCell ordercount={CancelOrderData} title="Cancel Order" CancelOrderGridCell />
          <GridCell ordercount={MostUsebox} title="Most use box" MostuseGridCell />
        </Grid>

        <div className="use-box-data-grid">
          <Grid>
            {useboxdata.map((item) => (
              <GridCell ordercount={item.totalQuantity} title={item.box_name} useboxdata />
            ))}
          </Grid>
        </div>

        <div className="dateRange-Picker-button">
          <DateRangePicker SelectedDate={setSelectedDate} />
        </div>
        <Layout>
          <Layout.Section>
            <LegacyCard title="" sectioned>
              <TableViewsWithFilter HistoryData={HistoryData} />
            </LegacyCard>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}

export default Historical;
