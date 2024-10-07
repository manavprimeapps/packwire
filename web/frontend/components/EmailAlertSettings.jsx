import { Grid, Layout, LegacyCard, Form, FormLayout, Button, TextField, Icon, Label } from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks';
import { useCallback, useState, useEffect } from 'react';

import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';

export function EmailAlertSettings({ alertemail, formData, setAlertEmail, setFormData, fetchShopData }) {
  const fetch = useAuthenticatedFetch();

  // Set the initial toggle state based on email alerts in the database
  const [enabled, setEnabled] = useState(() =>
    formData.emailalerts && formData.emailalerts.length > 0 ? true : false,
  );

  useEffect(() => {
    // If the formData changes, update the toggle based on email alerts
    setEnabled(formData.emailalerts && formData.emailalerts.length > 0);
  }, [formData.emailalerts]);

  const handleChange = (newValue) => {
    // Split the input value by commas, trim spaces, and store as an array
    const emailArray = newValue.split(',').map((email) => email.trim());

    // Update state variables
    setAlertEmail(newValue); // Store the formatted string
    setFormData((prevData) => ({
      ...prevData,
      emailalerts: emailArray, // Store as an array
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    settingsFormSubmit();
  };

  async function settingsFormSubmit() {
    try {
      const request = await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const response = await request.json();
      fetchShopData();
      console.log('Form submitted successfully:', response);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }

  const handleToggle = useCallback(() => {
    const newEnabledState = !enabled; // Invert the current state to get the new state

    setEnabled(newEnabledState);

    if (!newEnabledState) {
      // If disabling the toggle, clear the email input
      setAlertEmail('');
      setFormData((prevData) => ({
        ...prevData,
        emailalerts: [], // Reset emailalerts to an empty array
      }));
    }
  }, [enabled, setAlertEmail, setFormData]);

  const actionMarkup = (
    <div className="low-stock-toggle">
      <Label>Email Low Stock Alert</Label>
      <div
        className="low-stock-toggle-btn"
        role="switch"
        aria-checked={enabled ? 'true' : 'false'}
        onClick={handleToggle}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
      >
        {enabled ? <ToggleOnIcon style={{ color: '#0094fa' }} /> : <ToggleOffIcon style={{ color: '#0094fa' }} />}
      </div>
    </div>
  );

  return (
    <Layout.Section>
      <LegacyCard sectioned>
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                {actionMarkup}
                {enabled && (
                  <TextField
                    label="Add email to receive alerts for low stock"
                    type="text"
                    value={alertemail}
                    name="emailalerts"
                    onChange={(value) => handleChange(value)}
                    autoComplete="email"
                    placeholder="Enter email addresses, separated by commas"
                  />
                )}
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}></Grid.Cell>
            </Grid>
            <Button submit>Save</Button>
          </FormLayout>
        </Form>
      </LegacyCard>
    </Layout.Section>
  );
}
