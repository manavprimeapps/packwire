import React, { useState, useCallback, useEffect } from 'react';
import { Page, Layout, LegacyCard, TextContainer, ButtonGroup, Button } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedFetch } from '../hooks';
import { SelectOption, SettingToggles, DropZone, ProductSelecter } from '../components';

export function SingleItem({ isModalOpen, formData, setFormData, reload, Formheading, Storelocations, setloading }) {
  const { t } = useTranslation();
  const fetch = useAuthenticatedFetch();
  const [formErrors, setFormErrors] = useState({});

  function removeformdata() {
    setFormData({
      boxName: '',
      packagingtype: '',
      subtype: '',
      weight: '',
      cost: '',
      insidedimensions: [],
      outsidedimensions: [],
      flatdimensions: [],
      quantity: '',
      suppliername: '',
      contactinfo: '',
      leadtimes: '',
      warehouseLocation: '',
      shop_name: '',
      selectedItems: { productSelection: [], collectionSelection: [] },
    });
    setFormErrors({});
    reload();
  }

  const parseErrorString = (errorString) => {
    const errors = {};

    const errorLines = errorString
      .replace('Boxcollection validation failed:', '') // Remove the unwanted part of the string
      .split(',') // Split the string by commas
      .map((line) => line.trim()) // Trim whitespace from each line
      .filter((line) => line.includes(':')); // Only keep lines that include a colon (indicating a field and message)

    errorLines.forEach((line) => {
      const [field, message] = line.split(':');
      if (field && message) {
        const trimmedField = field.trim();
        const trimmedMessage = message.trim();
        errors[trimmedField] = trimmedMessage;
      }
    });

    return errors;
  };
  const submitHandler = async (e) => {
    e.preventDefault();
    setloading(false);
    setFormErrors({});

    try {
      const request = await fetch('/api/boxcollection/submited', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const response = await request.json();
      if (response.success) {
        isModalOpen(false); // Close modal on success
        removeformdata();
        reload();
      } else {
        setFormErrors(parseErrorString(response.error));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const valueHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <Page
      fullWidth
      title={Formheading}
      primaryAction={
        <ButtonGroup>
          <Button
            onClick={() => {
              isModalOpen(false);
              removeformdata();
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={submitHandler}>
            Save
          </Button>
        </ButtonGroup>
      }
      style="padding-bottom: 50px;"
    >
      <Layout>
        <form onSubmit={submitHandler} className="singel-item-form">
          <div className="form-fields">
            <Layout.Section>
              <LegacyCard sectioned>
                <div className="name-fields">
                  <label htmlFor="boxName">Box Name</label>
                  <input type="text" name="boxName" id="boxName" value={formData?.boxName} onChange={valueHandler} />
                  {formErrors.boxName && <p className="error-text">{formErrors.boxName}</p>}
                </div>
                <div className="selected-box-type">
                  <div className="half-width-container">
                    <label htmlFor="packagingtype">Packaging Type</label>
                    <input
                      type="text"
                      name="packagingtype"
                      id="packagingtype"
                      value={formData?.packagingtype}
                      onChange={valueHandler}
                    />
                    {formErrors.packagingtype && <p className="error-text">{formErrors.packagingtype}</p>}
                  </div>
                  <div className="half-width-container">
                    <label htmlFor="subtype">Sub-Type</label>
                    <input type="text" name="subtype" id="subtype" value={formData?.subtype} onChange={valueHandler} />
                    {formErrors.subtype && <p className="error-text">{formErrors.subtype}</p>}
                  </div>
                </div>
              </LegacyCard>
              <LegacyCard sectioned>
                <TextContainer>
                  <div className="inside-dimensions-wrapper">
                    <SettingToggles
                      label="Inside Dimensions"
                      formData={formData}
                      setFormData={setFormData}
                      dimensionKey="insidedimensions"
                    />
                  </div>
                  <div className="outside-dimensions-wrapper">
                    <SettingToggles
                      label="Outside Dimensions"
                      formData={formData}
                      setFormData={setFormData}
                      dimensionKey="outsidedimensions"
                    />
                  </div>
                  <div className="flat-dimensions-wrapper">
                    <SettingToggles
                      label="Flat Dimensions"
                      formData={formData}
                      setFormData={setFormData}
                      dimensionKey="flatdimensions"
                      FlatDimensions
                    />
                  </div>
                </TextContainer>
              </LegacyCard>
              <LegacyCard sectioned>
                <TextContainer>
                  <div className="quantity-weight-cost-container">
                    <div className="half-width-container">
                      <div className="quantity-fields">
                        <label htmlFor="quantity">Quantity</label>
                        <input
                          type="number"
                          name="quantity"
                          id="quantity"
                          value={formData?.quantity}
                          onChange={valueHandler}
                        />
                        {formErrors.quantity && <p className="error-text">{formErrors.quantity}</p>}
                      </div>
                    </div>
                    <div className="half-width-container">
                      <div className="weight-fields">
                        <label htmlFor="weight">Weight(g)</label>
                        <input
                          type="number"
                          name="weight"
                          id="weight"
                          value={formData?.weight}
                          onChange={valueHandler}
                        />
                        {formErrors.weight && <p className="error-text">{formErrors.weight}</p>}
                      </div>
                    </div>
                    <div className="half-width-container">
                      <div className="cost-fields">
                        <label htmlFor="cost">Cost($)</label>
                        <input type="text" name="cost" id="cost" value={formData?.cost} onChange={valueHandler} />
                        {formErrors.cost && <p className="error-text">{formErrors.cost}</p>}
                      </div>
                    </div>
                  </div>
                </TextContainer>
              </LegacyCard>
              <LegacyCard sectioned>
                <LegacyCard.Section>
                  <TextContainer>
                    <div className="supplier-name-fields">
                      <label htmlFor="supplier-name">Supplier Name</label>
                      <input
                        type="text"
                        name="suppliername"
                        id="suppliername"
                        value={formData?.suppliername}
                        onChange={valueHandler}
                      />
                      {formErrors.suppliername && <p className="error-text">{formErrors.suppliername}</p>}
                    </div>
                    <div className="contact-info-fields">
                      <label htmlFor="contact-info">Contact Info</label>
                      <input
                        type="text"
                        name="contactinfo"
                        id="contactinfo"
                        value={formData?.contactinfo}
                        onChange={valueHandler}
                      />
                      {formErrors.contactinfo && <p className="error-text">{formErrors.contactinfo}</p>}
                    </div>
                    <div className="lead-times-fields">
                      <label htmlFor="lead-times">Lead Times</label>
                      <input
                        type="text"
                        name="leadtimes"
                        id="leadtimes"
                        value={formData?.leadtimes}
                        onChange={valueHandler}
                      />
                      {formErrors.leadtimes && <p className="error-text">{formErrors.leadtimes}</p>}
                    </div>
                  </TextContainer>
                </LegacyCard.Section>
                <LegacyCard.Section>
                  <div className="warehouse-location-container">
                    <SelectOption
                      label="Warehouse Location"
                      options={Storelocations}
                      formData={formData}
                      setFormData={setFormData}
                      dimensionKey="warehouseLocation"
                    />
                  </div>
                </LegacyCard.Section>
              </LegacyCard>
              <LegacyCard sectioned>
                <LegacyCard.Section>
                  <div className="selectedItems-product-collection">
                    <ProductSelecter
                      formData={formData}
                      setFormData={setFormData}
                      pickerType="productSelection"
                      resourceType="Product"
                    />
                    <ProductSelecter
                      formData={formData}
                      setFormData={setFormData}
                      pickerType="collectionSelection"
                      resourceType="Collection"
                    />
                  </div>
                </LegacyCard.Section>
              </LegacyCard>
            </Layout.Section>
            <div className="file-upload-section">
              <Layout.Section oneThird>
                <LegacyCard subdued>
                  <LegacyCard.Section>
                    <TextContainer>
                      <div className="upload-image">
                        <DropZone setFormData={setFormData} formData={formData} />
                      </div>
                    </TextContainer>
                  </LegacyCard.Section>
                </LegacyCard>
              </Layout.Section>
            </div>
          </div>
        </form>
      </Layout>
    </Page>
  );
}
