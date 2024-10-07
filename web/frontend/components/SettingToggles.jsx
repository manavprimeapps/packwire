import {
  Text,
  // eslint-disable-next-line import/no-deprecated
  SettingToggle,
} from '@shopify/polaris';
import { useState, useCallback, useEffect } from 'react';

export function SettingToggles({ label, formData, setFormData, dimensionKey, FlatDimensions }) {
  const [enabled, setEnabled] = useState(false);

  // Initialize the toggle based on existing dimension data
  useEffect(() => {
    if (formData[dimensionKey]?.[0]?.Height || formData[dimensionKey]?.[0]?.Width) {
      setEnabled(true);
    }
  }, [formData, dimensionKey]);

  const contentStatus = enabled ? 'Remove' : 'Add';
  const handleToggle = useCallback(() => {
    setEnabled((enabled) => {
      const newEnabled = !enabled;

      // If disabling, clear the dimension data
      if (!newEnabled) {
        setFormData((prevData) => ({
          ...prevData,
          [dimensionKey]: [], // Clear dimension data
        }));
      }
      return newEnabled;
    });
  }, [setFormData, dimensionKey]);

  const valueHandler = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const updatedDimensions = [
        {
          ...prevData[dimensionKey]?.[0], // Preserve existing values
          [name]: value, // Update the field that changed
        },
      ];

      return {
        ...prevData,
        [dimensionKey]: updatedDimensions,
      };
    });
  };

  return (
    <SettingToggle
      enabled={enabled}
      action={{
        content: contentStatus,
        onAction: handleToggle,
      }}
    >
      <label htmlFor="boxHeight">{label}</label>
      {enabled && (
        <div className="half-width-container">
          <div className="half-width-item">
            <label htmlFor="boxHeight">Height (inch)</label>
            <input
              type="number"
              name="Height"
              id="boxHeight"
              value={formData[dimensionKey]?.[0]?.Height || ''}
              onChange={valueHandler}
            />
          </div>

          <div className="half-width-item">
            <label htmlFor="boxWidth">Width (inch)</label>
            <input
              type="number"
              name="Width"
              id="boxWidth"
              value={formData[dimensionKey]?.[0]?.Width || ''}
              onChange={valueHandler}
            />
          </div>

          {!FlatDimensions && (
            <div className="half-width-item">
              <label htmlFor="boxDepth">Depth (inch)</label>
              <input
                type="number"
                name="Depth"
                id="boxDepth"
                value={formData[dimensionKey]?.[0]?.Depth || ''}
                onChange={valueHandler}
              />
            </div>
          )}
        </div>
      )}
    </SettingToggle>
  );
}
