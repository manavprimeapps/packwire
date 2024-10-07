import { Select } from '@shopify/polaris';
import { useState, useEffect } from 'react';

export function ConditionSelectOption({ options, dimensionKey, formData, setFormData, index }) {
  const [selected, setSelected] = useState(formData[dimensionKey] || '');

  useEffect(() => {
    // When formData changes, update the selected value
    if (formData[dimensionKey] !== selected) {
      setSelected(formData[dimensionKey]);
    }
  }, [formData, dimensionKey, selected]);

  const handleSelectChange = (value) => {
    setSelected(value);
    setFormData(value); // Update parent formData through setFormData
  };

  const selectOptions = options.map((option) => ({
    label: option.label, // Assuming each option has a 'boxName'
    value: option.value, // Assuming each option has a 'boxId'
  }));

  return <Select label="" options={selectOptions} onChange={handleSelectChange} value={selected} />;
}
