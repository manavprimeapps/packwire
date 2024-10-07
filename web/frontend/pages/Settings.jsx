import React, { useState, useCallback, useEffect } from 'react';
import { Page, LegacyCard, Loading, Frame, Tabs } from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks';
import { EmailAlertSettings } from '../components/EmailAlertSettings';
import { BoxConditionSettings } from '../components/BoxConditionSettings';

function Settings() {
  const fetch = useAuthenticatedFetch();
  const [alertemail, setAlertEmail] = useState(''); // State for email
  const [formData, setFormData] = useState({});
  const [loading, setloading] = useState(true);
  const [boxcollectionsData, setboxcollectionsdata] = useState([]);
  const [ConditionsData, setConditionsData] = useState([]);
  const [ShopName, setShopName] = useState('');
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    fetchShopData();
    fetchboxcollectionsData();
    fetchConditionsData();
  }, []);

  async function fetchShopData() {
    setloading(false);
    try {
      const response = await fetch('/api/store/info', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data?.app_data) {
        settingsFormSubmit();
      }
      const email = data?.app_data?.emailalerts || data?.data?.[0]?.email; // Extract email
      email.join(', ');

      setAlertEmail(email); // Set the email for alerts
      setFormData((prevData) => ({
        ...prevData,
        _id: data?.app_data?.sett_id || prevData._id, // Safely set sett_id
        emailalerts: email, // Initialize formData with the fetched email
      }));
      setloading(true);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  }

  async function fetchboxcollectionsData() {
    setloading(false);
    try {
      let request = await fetch('/api/boxcollection/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      let response = await request.json();
      if (response.success == true) {
        const Boxdata = [{ label: 'Select Box', value: '' }]; // Initialize as an array
        if (Array.isArray(response.response)) {
          response.response.forEach(({ _id, boxName }) => {
            Boxdata.push({
              label: boxName,
              value: _id,
            });
          });
        }
        setboxcollectionsdata(Boxdata);
        setloading(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  }

  // Fetch the conditions data from the API
  async function fetchConditionsData() {
    setloading(false);
    try {
      const response = await fetch('/api/Conditions/fetch', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data) {
        setConditionsData(data.condition);
        const shopName = data.shopName.replace('.myshopify.com', '');
        setShopName(shopName);
        setloading(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  }

  const handleTabChange = useCallback((selectedTabIndex) => setSelected(selectedTabIndex), []);

  const tabs = [
    {
      id: 'email-alert',
      content: 'Email alert',
      accessibilityLabel: 'Email alert settings',
      panelID: 'low-stock-email-alert',
    },
    {
      id: 'box-condition ',
      content: 'Box condition',
      panelID: 'add-box-condition',
    },
  ];
  const Emailalerts = () => (
    <EmailAlertSettings
      alertemail={alertemail}
      formData={formData}
      setAlertEmail={setAlertEmail}
      setFormData={setFormData}
      fetchShopData={fetchShopData}
    />
  );
  const BoxCondition = () => (
    <BoxConditionSettings
      boxcollectionsData={boxcollectionsData}
      ConditionsData={ConditionsData}
      fetchConditionsData={fetchConditionsData}
      ShopName={ShopName}
    />
  );

  const renderTabContent = () => {
    switch (selected) {
      case 0:
        return <Emailalerts />;
      case 1:
        return <BoxCondition />;
      default:
        return null;
    }
  };
  return (
    <Frame>
      <Page fullWidth>
        {!loading && <Loading />}
        <LegacyCard>
          <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange} disclosureText="More views">
            <LegacyCard.Section>{renderTabContent()}</LegacyCard.Section>
          </Tabs>
        </LegacyCard>
      </Page>
    </Frame>
  );
}

export default Settings;
