import {
  Page,
  Layout,
  Loading,
  Frame,
  Modal,
  TextContainer,
  DropZone,
  Button,
  Icon,
  TextField,
  Text,
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { useTranslation } from 'react-i18next';
import { useState, useCallback, useEffect } from 'react';
import { useAuthenticatedFetch } from '../hooks';
import { SearchTable, SingleItem } from '../components';
import { ImportIcon, CheckSmallIcon, ExportIcon } from '@shopify/polaris-icons';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

export default function PageName() {
  const { t } = useTranslation();
  const fetch = useAuthenticatedFetch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [loading, setloading] = useState(true);
  const [boxcollectionsData, setboxcollectionsdata] = useState([]);
  const [Storelocations, setStorelocations] = useState([]);
  const [deleteBoxID, SetDeleteBoxId] = useState('');
  const [editBoxID, SetEditBoxID] = useState('');
  const [Formheading, setFormheading] = useState('');
  const [active, setActive] = useState(false);
  const [files, setFiles] = useState([]);
  // From data Store in state
  const [formData, setFormData] = useState({
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
    selectedItems: { productSelection: [], collectionSelection: [] },
  });

  useEffect(() => {
    fetchboxcollectionsData();
    getlocations();
    // installcreateGQL();
    installWebhook();
  }, []);

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
        setboxcollectionsdata(response.response);
        setIsModalOpen(false);
        setloading(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  }

  // get the store loction
  async function getlocations() {
    try {
      let request = await fetch('/api/locations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (request.ok) {
        let response = await request.json();

        const locations = [{ label: 'Select Warehouse Location', value: '' }]; // Initialize as an array
        if (Array.isArray(response.response)) {
          response.response.forEach(({ id, name, city, zip, country_name }) => {
            locations.push({
              label: `${name}${city ? `,${city}` : ''}${zip ? ` (${zip})` : ''}${country_name ? `,${country_name}` : ''}`,
              value: `${name}${city ? `,${city}` : ''}${zip ? ` (${zip})` : ''}${country_name ? `,${country_name}` : ''}`,
              _id: id,
            });
          });
        }
        setStorelocations(locations);
      } else {
        console.error('Error Get locations:', response);
        // Handle the error response as needed
      }
    } catch (error) {
      console.error('Error calling /getlocations API:', error.message);
    }
  }

  useEffect(() => {
    const deleteboxcollections = async (id) => {
      if (!id) return; // If there's no ID, don't make the request
      try {
        setloading(false);
        const request = await fetch('/api/boxcollection/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deleteBoxID: id }),
        });

        const response = await request.json();

        if (response.success) {
          fetchboxcollectionsData();
          SetDeleteBoxId(''); // Clear the deleteBoxID after deletion
        } else {
          // Handle response failure (if needed)
          console.error('Deletion failed:', response.message);
        }
      } catch (error) {
        console.error('Error deleting box collection:', error);
      }
    };

    if (deleteBoxID) {
      deleteboxcollections(deleteBoxID);
    }
  }, [deleteBoxID]);

  useEffect(() => {
    async function BoxHandler(boxID) {
      setloading(false);
      try {
        const request = await fetch(`/api/boxcollection/all?boxID=${encodeURIComponent(boxID)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const response = await request.json();
        const searchBox = response?.response;

        if (searchBox) {
          setFormData(() => ({
            ...searchBox[0],
          }));
          setFormheading('Edit Box');
          setloading(true);
          setIsModalOpen(true);
        }

        SetEditBoxID('');
      } catch (error) {
        console.error('Error fetching box data:', error);
      }
    }

    if (editBoxID) {
      BoxHandler(editBoxID);
    }
  }, [editBoxID]);

  // Modal opensss
  const handleModalOpen = () => {
    setIsModalOpen(true);
    setFormheading('Create New Box');
  };

  const installWebhook = async () => {
    try {
      let request = await fetch('/api/hook/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      let response = await request.text(); // Assuming your API returns text

      if (request.ok) {
        console.log('Webhook registered successfully:', response);
        // You can add additional logic here if needed
      } else {
        console.error('Error registering webhook:', response);
        // Handle the error response as needed
      }
    } catch (error) {
      console.error('Error calling /install API:', error.message);
    }
  };

  const installcreateGQL = async () => {
    try {
      let request = await fetch('/api/metafield/createGQL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      let response = await request.text(); // Assuming your API returns text

      if (request.ok) {
        console.log('Metafield create successfully:', response);
        // You can add additional logic here if needed
      } else {
        console.error('Error Metafield create:', response);
        // Handle the error response as needed
      }
    } catch (error) {
      console.error('Error calling /install API:', error.message);
    }
  };

  const handleExportCSV = () => {
    const flattenboxcollectionsData = boxcollectionsData.map((item) => ({
      boxName: item.boxName,
      packagingtype: item.packagingtype,
      subtype: item.subtype,
      insidedimensionsHeight: item.insidedimensions[0]?.Height,
      insidedimensionsWidth: item.insidedimensions[0]?.Width,
      insidedimensionsDepth: item.insidedimensions[0]?.Depth,
      flatdimensionsHeight: item.flatdimensions[0]?.Height,
      flatdimensionsWidth: item.flatdimensions[0]?.Width,
      outsidedimensionsHeight: item.outsidedimensions[0]?.Height,
      outsidedimensionsWidth: item.outsidedimensions[0]?.Width,
      outsidedimensionsDepth: item.outsidedimensions[0]?.Depth,
      productSelection: Array.isArray(item.selectedItems.productSelection)
        ? item.selectedItems.productSelection.map((product) => product.sku).join(', ')
        : '',
      quantity: item.quantity,
      shop_name: item.shop_name,
      cost: item.cost,
      weight: item.weight,
      warehouseLocation: item.warehouseLocation,
      contactinfo: item.contactinfo,
      leadtimes: item.leadtimes,
      suppliername: item.suppliername,
    }));
    const csvData = Papa.unparse(flattenboxcollectionsData);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'boxcollections.csv');
  };

  const handleChange = useCallback(() => {
    setActive(!active);
    setFiles([]);
  }, [active]);

  const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles, _rejectedFiles) => {
    setFiles((files) => [...files, ...acceptedFiles]);
  }, []);

  const filename = files.map((file, index) => file.name);

  // Handle the import action (parse the CSV and send to backend)
  const handleImportAction = () => {
    setloading(false);
    if (files.length === 0) {
      console.error('No file uploaded.');
      return;
    }
    const file = files[0]; // Assuming one file at a time

    // Parse the CSV file using PapaParse
    Papa.parse(file, {
      header: true,
      complete: (result) => {
        console.log('Parsed CSV data:', result.data);

        // Transform the data for each row
        const transformedData = result.data.map(transformData);

        fetch('/api/import-box-collections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: transformedData }), // Send the transformed data
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Successfully imported:', data);
            setActive(false);
            fetchboxcollectionsData();
            setloading(true);
          })
          .catch((error) => {
            console.error('Error importing data:', error);
          });
      },
    });
  };

  return (
    <Frame>
      <Page fullWidth>
        <TitleBar
          title="Box dashboard"
          primaryAction={{
            content: 'Create order',
            onAction: () => window.open('https://packwire.com/mailer-box', '_blank'),
          }}
          secondaryActions={
            !isModalOpen
              ? [
                  {
                    content: 'Add New Box', // Use t('Add New Box') if using translation
                    onAction: handleModalOpen,
                  },
                ]
              : undefined
          }
          actionGroups={[
            {
              title: 'More actions',
              actions: [
                {
                  content: 'Import file',
                  icon: ImportIcon,
                  onAction: handleChange,
                },
                {
                  content: 'Export file',
                  icon: ExportIcon,
                  onAction: handleExportCSV,
                },
              ],
            },
          ]}
        />
        <Layout>
          {/* <Tabledata boxdata={boxcollectionsData} delete={SetDeleteBoxId} edit={SetEditBoxID} /> */}
          <SearchTable boxdata={boxcollectionsData} delete={SetDeleteBoxId} edit={SetEditBoxID} />
        </Layout>
        {!loading && <Loading />}
      </Page>
      {isModalOpen && (
        <div className="product-modal">
          <Frame>
            <SingleItem
              isModalOpen={setIsModalOpen}
              formData={formData}
              setFormData={setFormData}
              reload={fetchboxcollectionsData}
              Formheading={Formheading}
              setloading={setloading}
              Storelocations={Storelocations}
            />
          </Frame>
        </div>
      )}
      {active && (
        <div>
          <Modal
            open={active}
            onClose={handleChange}
            title="Import box collections"
            primaryAction={
              files.length > 0
                ? [
                    {
                      content: 'Import',
                      onAction: handleImportAction, // Trigger the import action
                    },
                  ]
                : [
                    {
                      content: 'Import',
                    },
                  ]
            }
            secondaryActions={[
              {
                content: 'Cancel',
                onAction: handleChange,
              },
            ]}
          >
            <Modal.Section>
              <TextContainer>
                <DropZone onDrop={handleDropZoneDrop} accept=".csv" type="file">
                  {files.length > 0 ? (
                    <Text className="import-dropZone-file-name" alignment="center">
                      {filename[0]}
                    </Text>
                  ) : (
                    <DropZone.FileUpload />
                  )}
                </DropZone>
              </TextContainer>
            </Modal.Section>
          </Modal>
        </div>
      )}
    </Frame>
  );
}

function transformData(data) {
  const insidedimensions = {};
  if (data.insidedimensionsHeight && data.insidedimensionsWidth && data.insidedimensionsDepth) {
    insidedimensions.Height = data.insidedimensionsHeight;
    insidedimensions.Width = data.insidedimensionsWidth;
    insidedimensions.Depth = data.insidedimensionsDepth;
  }

  const flatdimensions = {};
  if (data.flatdimensionsHeight && data.flatdimensionsWidth) {
    flatdimensions.Height = data.flatdimensionsHeight;
    flatdimensions.Width = data.flatdimensionsWidth;
  }

  const outsidedimensions = {};
  if (data.outsidedimensionsHeight && data.outsidedimensionsWidth && data.outsidedimensionsDepth) {
    outsidedimensions.Height = data.insidedimensionsHeight;
    outsidedimensions.Width = data.insidedimensionsWidth;
    outsidedimensions.Depth = data.insidedimensionsDepth;
  }
  return {
    boxName: data.boxName,
    packagingtype: data.packagingtype,
    subtype: data.subtype,
    insidedimensions: Object.keys(insidedimensions).length ? [insidedimensions] : [],
    flatdimensions: Object.keys(flatdimensions).length ? [flatdimensions] : [], // Include only if dimensions exist
    outsidedimensions: Object.keys(outsidedimensions).length ? [outsidedimensions] : [],
    selectedItems: {
      productSelection: data.productSelection ? data.productSelection.split(', ') : [],
      collectionSelection: data.collectionSelection ? [data.collectionSelection] : [],
    },
    quantity: parseInt(data.quantity, 10) || 0,
    files: data.files || [],
    cost: parseFloat(data.cost) || 0,
    weight: parseFloat(data.weight) || 0,
    warehouseLocation: data.warehouseLocation,
    contactinfo: data.contactinfo,
    leadtimes: data.leadtimes,
    suppliername: data.suppliername,
  };
}
