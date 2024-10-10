import { PlusCircleIcon, MinusCircleIcon } from '@shopify/polaris-icons';
import { FormLayout, Form, Layout, Card, Button, Text, InlineGrid, BlockStack, Frame } from '@shopify/polaris';
import { ConditionSelectOption } from './ConditionSelectOption';
import { useAuthenticatedFetch } from '../hooks';
import { useEffect, useState } from 'react';
import { ConditionProductSelecter } from './ConditionProductSelecter';
import { ResourceItems } from '.';

export function BoxConditionSettings({ boxcollectionsData, ConditionsData, fetchConditionsData, ShopName }) {
  const fetch = useAuthenticatedFetch();

  // State for conditions (this is where conditions are handled)
  const [conditions, setConditions] = useState([
    {
      box_name: '',
      productSelection: [],
    },
  ]);

  // Fetch conditions data on component load
  useEffect(() => {
    if (ConditionsData && ConditionsData.length > 0) {
      setConditions(ConditionsData);
    }
  }, [ConditionsData]);

  // Submit form data, syncing conditions into formData
  async function settingsFormSubmit(updatedFormData) {
    try {
      const request = await fetch('/api/Conditions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFormData),
      });

      const response = await request.json();
      fetchConditionsData();
      console.log('Form submitted successfully:', response);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Update formData with the latest conditions before submitting
    const updatedFormData = {
      condition: conditions,
    };
    // Call the submit function with updated formData
    settingsFormSubmit(updatedFormData);
  };

  // Handle changes for a specific condition field
  const handleConditionChange = (index, key, value) => {
    setConditions((prevConditions) =>
      prevConditions.map((condition, i) =>
        i === index
          ? {
              ...condition,
              [key]: value,
            }
          : condition,
      ),
    );
  };

  // Function to add a new condition
  const addCondition = () => {
    const newCondition = {
      box_name: '',
      productSelection: [],
    };

    // Update the conditions array by adding a new condition
    setConditions((prevConditions) => [...prevConditions, newCondition]);
  };

  const removeCondition = (index) => {
    console.log(index);
    const newConditions = conditions.filter((_, i) => i !== index); // Filter out the condition by index
    setConditions(newConditions);
  };
  return (
    <Layout>
      <Layout.Section>
        <Form onSubmit={handleSubmit}>
          <div className="conditions_form_container">
            <FormLayout>
              <div className="box-condition-label">
                <Text variant="bodyMd" fontWeight="bold" as="h1">
                  Add condition
                </Text>
              </div>
              {conditions.map((condition, index) => (
                <div key={index} className="box-condition-section">
                  <Card roundedAbove="sm">
                    <BlockStack gap="200">
                      <InlineGrid columns="1fr auto">
                        <Text as="h2" variant="headingSm">
                          <ConditionSelectOption
                            options={boxcollectionsData}
                            dimensionKey="box_name"
                            index={index}
                            formData={condition}
                            setFormData={(value) => handleConditionChange(index, 'box_name', value)}
                          />
                        </Text>
                        <ConditionProductSelecter
                          formData={condition}
                          setFormData={(value) => handleConditionChange(index, 'productSelection', value)}
                          pickerType="productSelection"
                          resourceType="Product"
                          title={false}
                        />
                      </InlineGrid>
                      <div className="ResourceItem-section">
                        <ResourceItems formData={condition} ShopName={ShopName} />
                      </div>
                    </BlockStack>
                  </Card>

                  <div style={{ width: 30, textAlign: 'center', marginTop: '10px', display: 'grid', gap: '10px' }}>
                    <Button onClick={addCondition} icon={PlusCircleIcon} plain accessibilityLabel="Add new condition" />
                    <Button
                      onClick={() => removeCondition(index)}
                      icon={MinusCircleIcon}
                      plain
                      accessibilityLabel="Remove condition"
                    />
                  </div>
                </div>
              ))}
            </FormLayout>
          </div>
          <Button submit primary>
            Save
          </Button>
        </Form>
      </Layout.Section>
    </Layout>
  );
}
