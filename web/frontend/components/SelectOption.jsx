import { Select } from '@shopify/polaris';
import { useState, useCallback, useEffect } from 'react';

export function SelectOption({ label, options, dimensionKey, formData, setFormData }) {
  // Find the option where the dimensionKey value matches the _id (for editing)

  const matchingOption = options.find((option) => option.value == formData[dimensionKey]);

  // Initialize selected state based on the matching option's value or an empty string
  const [selected, setSelected] = useState(matchingOption ? matchingOption.value : '');
  const handleSelectChange = useCallback(
    (value) => {
      setSelected(value);
      
      // Find the selected option in the options array
      const selectedOption = options.find((option) => option.value === value);
      console.log(setFormData)
      // Update formData based on dimensionKey
      setFormData((prevData) => ({
        ...prevData,
        [dimensionKey]: selectedOption?.value || value,
      }));
    },
    [dimensionKey, options, setFormData],
  );

  useEffect(() => {
    // Update the selected value if formData changes externally (e.g., during form editing)
    const updatedSelected =
      options.find((option) => option.value === formData[dimensionKey])?.value || formData[dimensionKey] || '';
    setSelected(updatedSelected);
  }, [formData, dimensionKey, options]);

  return (
    <Select
      label={label}
      options={options}
      onChange={handleSelectChange}
      value={selected} // Bind selected value to the select input
    />
  );
}
