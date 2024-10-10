// @ts-nocheck
import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import multer from 'multer';
import shopify from './shopify.js';
import PrivacyWebhookHandlers from './privacy.js';
import Boxcollection from './models/boxcollections.js';
import storeinformation from './models/storeinformation.js';
import filecollection from './models/filecollections.js';
import historicaldata from './models/historicaldata.js';
import Conditioncollection from './models/conditioncollections.js';
import connection from './connection.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch'; // Ensure node-fetch is imported

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// connection.then(() => console.log('connected')).catch((err) => console.log('mongo err', err));

const app = express();

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || '3000', 10); // Default to 3000

// Start the server on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const STATIC_PATH =
  process.env.NODE_ENV === 'production' ? `${process.cwd()}/frontend/dist` : `${process.cwd()}/frontend/`;

app.use(bodyParser.json());
app.use(express.json());

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(shopify.config.auth.callbackPath, shopify.auth.callback(), shopify.redirectToShopifyOrAppRoot());
app.post(shopify.config.webhooks.path, shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers }));

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use('/api/*', shopify.validateAuthenticatedSession());

/**
 * metafield create for all product
 */
app.post('/api/metafield/createGQL', async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const result = await createMetaField(session);

    res.status(200).send(result);
  } catch (error) {
    console.error('Error during metafield creation:', error);
    res.status(500).send({ error: 'Failed to create metafield', details: error.message });
  }
});

async function createMetaField(session, timeout = 10000) {
  // Default timeout 10 seconds
  try {
    const client = new shopify.api.clients.Graphql({ session });

    // Metafield definitions to be created
    const metafieldDefinitions = [
      {
        name: 'packwire box name',
        namespace: 'packwire',
        key: 'packwire_box_name',
        type: 'single_line_text_field',
        description: 'This is the app metafield for products',
        ownerType: 'PRODUCT',
        pin: true,
      },
      {
        name: 'packwire box name',
        namespace: 'packwire',
        key: 'packwire_box_name',
        type: 'multi_line_text_field',
        description: 'This is the app metafield for products',
        ownerType: 'ORDER',
        pin: true,
      },
    ];

    // Helper function to add timeout to any promise
    const withTimeout = (promise, ms) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
        promise
          .then((res) => {
            clearTimeout(timer); // Clear the timeout if the request succeeds
            resolve(res);
          })
          .catch((err) => {
            clearTimeout(timer); // Clear the timeout on error
            reject(err);
          });
      });
    };

    // Check if the metafield definitions already exist for the PRODUCT owner type
    const queries = metafieldDefinitions.map((definition) => {
      return withTimeout(
        client.query({
          data: {
            query: `
              query {
                metafieldDefinitions(first: 250, namespace: "packwire", ownerType: ${definition.ownerType}) {
                  edges {
                    node {
                      key
                    }
                  }
                }
              }
            `,
          },
        }),
        timeout // Apply the timeout to each request
      );
    });

    const existingMetafieldsResponses = await Promise.all(queries);

    // Extract existing keys for both PRODUCT and ORDER metafields
    const existingKeys = existingMetafieldsResponses.reduce((keys, response, index) => {
      const existingMetafieldsData = response.body?.data?.metafieldDefinitions;
      if (existingMetafieldsData) {
        const newKeys = existingMetafieldsData.edges.map((edge) => edge.node.key);
        keys[metafieldDefinitions[index].ownerType] = newKeys;
      } else {
        throw new Error(`Failed to fetch existing metafields for ${metafieldDefinitions[index].ownerType}`);
      }
      return keys;
    }, {});

    // Filter metafield definitions that don't already exist
    const metafieldsToCreate = metafieldDefinitions.filter(
      (definition) => !existingKeys[definition.ownerType].includes(definition.key)
    );

    // Create metafield definitions only if they don't already exist
    if (metafieldsToCreate.length > 0) {
      const results = await Promise.all(
        metafieldsToCreate.map((definition) =>
          withTimeout(
            client.query({
              data: {
                query: `
                  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
                    metafieldDefinitionCreate(definition: $definition) {
                      createdDefinition {
                        id
                        name
                      }
                      userErrors {
                        field
                        message
                        code
                      }
                    }
                  }
                `,
                variables: {
                  definition,
                },
              },
            }),
            timeout // Apply timeout for creation requests
          )
        )
      );
      console.log('Metafield creation results:', results);
      return { message: 'Metafields created successfully', results };
    } else {
      console.log('Metafields already exist, no need to create them.');
      return { message: 'Metafields already exist, no need to create them.' };
    }
  } catch (error) {
    console.error('Error creating metafield definitions:', error);
    throw error;
  }
}

// @ts-ignore

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

/**
 * get Shop info
 */
app.get('/api/store/info', async (req, res) => {
  try {
    // Fetch store info from Shopify API
    const storeInfo = await shopify.api.rest.Shop.all({
      session: res.locals.shopify.session,
    });
    // Fetch additional information from your database
    const response = await storeinformation.find({ shop_name: res.locals.shopify.session.shop }).exec();
    // If response is found, append app_data to storeInfo
    if (response) {
      const { condition, emailalerts, _id: sett_id } = response[0];
      // @ts-ignore
      storeInfo.app_data = { emailalerts, sett_id, condition };
    }

    // Send the combined storeInfo data
    res.status(200).send(storeInfo);
  } catch (error) {
    console.error('Error fetching store info:', error.message);
    res.status(500).send({ error: 'Failed to retrieve store information.' });
  }
});

/**
 * Register Webhook for create order
 */
// @ts-ignore
app.post('/api/hook/install', async (req, res) => {
  const shop = res.locals.shopify.session.shop;
  const accessToken = res.locals.shopify.session.accessToken;
  const webhookUrl = 'https://6605-115-246-18-178.ngrok-free.app';

  console.log('Attempting to register webhook with URL:', webhookUrl);

  try {
    await RegisterWebhook(shop, accessToken, webhookUrl);
    res.status(200).send('Webhook registered successfully');
  } catch (error) {
    console.error('Error during webhook registration:', error.message);
    res.status(500).send('Error registering webhook');
  }
});

/**
 * Register Webhook function
 */
async function RegisterWebhook(shop, accessToken, webhookUrl, retryCount = 3) {
  const webhooks = [
    {
      topic: 'orders/create',
      address: `${webhookUrl}/webhook/orders/create`,
      format: 'json',
    },
    {
      topic: 'orders/cancelled',
      address: `${webhookUrl}/webhook/orders/cancel`,
      format: 'json',
    },
  ];

  for (const webhook of webhooks) {
    let attempts = 0;
    let success = false;

    while (attempts < retryCount && !success) {
      try {
        const response = await fetch(`https://${shop}/admin/api/2024-07/webhooks.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
          body: JSON.stringify({ webhook }),
          timeout: 10000, // Set a 10-second timeout for the request
        });

        if (!response.ok) {
          throw new Error(`Shopify API returned status code ${response.status}`);
        }

        const data = await response.json();
        console.log(`Webhook registration response for ${webhook.topic}:`, data);
        success = true; // Mark as successful
      } catch (error) {
        attempts++;
        // if (attempts >= retryCount) {
        //   console.error(`Failed to register webhook after ${retryCount} attempts`);
        // }
      }
    }
  }
}

/**
 * email alert
 */
const transporter = nodemailer.createTransport({
  host: 'sandbox-smtp.mailcatch.app',
  port: 2525,
  auth: {
    user: '153d700585c7', // Replace with your Mailtrap username
    pass: 'd65a78f3ff1f', // Replace with your Mailtrap password
  },
});

/**
 * Function to send an email alert
 */
async function sendEmailAlert(toEmail, subject, templatePath, replacements) {
  try {
    // Read the template file
    const template = fs.readFileSync(path.join(__dirname, templatePath), 'utf-8');

    // Replace placeholders in the template with actual values
    const htmlContent = template.replace(/{{(\w+)}}/g, (_, key) => replacements[key] || '');

    const mailOptions = {
      from: 'your-email@example.com', // Sender's email (Mailtrap allows any email here)
      to: toEmail, // Recipient's email
      subject: subject, // Email subject
      html: htmlContent, // HTML body
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

/**
 * App Webhook for orders-create
 */
const processedWebhooks = new Set(); // Store processed webhook IDs

app.post('/webhook/orders/create', async (req, res) => {
  try {
    const orderData = req.body;
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const webhookId = req.headers['x-shopify-webhook-id']; // Webhook ID for deduplication
    const processedProducts = new Set(); // To track already processed products

    if (!webhookId || processedWebhooks.has(webhookId)) {
      console.log('Duplicate or invalid webhook, skipping processing');
      return res.status(400).send('Webhook invalid or already processed');
    }

    // Mark webhook as processed
    processedWebhooks.add(webhookId);

    // Validate shop domain
    if (!shopDomain) {
      console.log('Shop domain missing in headers');
      return res.status(400).send('Shop domain missing');
    }

    const storeInfo = await storeinformation.findOne({ shop_name: shopDomain }).exec();
    if (!storeInfo || !storeInfo.shop_accessToken) {
      console.log('Access token not found for shop:', shopDomain);
      return res.status(400).send('Access token missing');
    }

    const { shop_accessToken: accessToken, shop_name } = storeInfo;

    // Fetch matching box data
    const boxData = await getBoxNameBy(orderData.line_items, shop_name);

    if (boxData && boxData.box) {
      // Handle matched box data
      await processMatchedBox(boxData, orderData, shopDomain, shop_name, accessToken);
    }

    if (boxData && boxData.unmatchedProductIds) {
      // Handle unmatched products in the order
      orderData.line_items = orderData.line_items.filter((item) =>
        boxData.unmatchedProductIds.includes(item.product_id)
      );
    }

    // Process remaining unmatched boxes
    await processUnmatchedBoxes(orderData, shop_name, shopDomain, accessToken);

    res.status(200).send('Order processed successfully');
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    if (!res.headersSent) {
      return res.status(500).send('Error processing webhook');
    }
  }
});

/**
 * Helper function to process matched box data
 */
const processMatchedBox = async (boxData, orderData, shopDomain, shop_name, accessToken) => {
  const boxDetails = await Boxcollection.findOne({
    _id: boxData.box,
    shop_name: shop_name,
  });

  if (boxDetails) {
    const matchedProductIdsSet = new Set(boxData.matchedProductIds);
    const matchedLineItems = orderData.line_items.filter((item) => matchedProductIdsSet.has(item.product_id));

    // Update box quantity based on highest product quantity
    const highestQuantity = Math.max(...matchedLineItems.map((item) => item.quantity));
    const newQuantity = Math.max(boxDetails.quantity - highestQuantity, 0);

    if (boxDetails.quantity !== newQuantity) {
      await Boxcollection.updateOne({ _id: boxDetails._id }, { $set: { quantity: newQuantity } });
      await checkAndSendLowStockAlert(boxDetails, shopDomain);

      for (const item of matchedLineItems) {
        await historyLogSave(
          boxDetails._id,
          orderData.id,
          orderData.name,
          boxDetails.boxName,
          item.name,
          item.quantity,
          shopDomain,
          accessToken,
          'created'
        );
      }

      // Save the box name as a metafield on the order
      await saveOrderMetafield(orderData.id, boxDetails.boxName, shopDomain, accessToken);
    }
  }
};

/**
 * Helper function to process unmatched boxes
 */
const processUnmatchedBoxes = async (orderData, shop_name, shopDomain, accessToken) => {
  for (const item of orderData.line_items) {
    const productId = String(item.product_id);
    const boxes = await Boxcollection.find({
      'selectedItems.productSelection.id': productId,
      shop_name: shop_name,
    });

    for (const box of boxes) {
      const newQuantity = Math.max(box.quantity - item.quantity, 0);

      if (box.quantity !== newQuantity) {
        box.quantity = newQuantity;
        await box.save();
        await checkAndSendLowStockAlert(box, shopDomain);

        await historyLogSave(
          box._id,
          orderData.id,
          orderData.name,
          box.boxName,
          item.name,
          item.quantity,
          shopDomain,
          accessToken,
          'created'
        );

        // Save the box name as a metafield on the order
        await saveOrderMetafield(orderData.id, box.boxName, shopDomain, accessToken);
      }
    }
  }
};

const getBoxNameBy = async (lineItems, shop_name) => {
  try {
    // Fetch condition data from the database (adjust query based on your schema)
    const conditionData = await Conditioncollection.findOne({ shop_name: shop_name }).exec();
    if (conditionData && conditionData.condition) {
      // Iterate over each condition in the database
      for (const condition of conditionData.condition) {
        const matchedProductIds = [];
        const unmatchedProductIds = [];

        // Check how many products from lineItems match the current condition
        lineItems.forEach((item) => {
          const productMatch = condition.productSelection.find((product) => product.id == item.product_id);

          if (productMatch) {
            // Store the product ID if it matches the current condition
            matchedProductIds.push(item.product_id);
          } else {
            unmatchedProductIds.push(item.product_id);
          }
        });

        // If two or more products match the same condition, return the condition's box and matched product IDs
        if (matchedProductIds.length >= 2) {
          return {
            box: condition.box_name, // Return the box name for the matched condition
            matchedProductIds, // Return the product IDs that matched the condition
            unmatchedProductIds, // Return the product IDs that did not match the condition
          };
        }
      }

      // If no conditions match for two or more products, return null
      return null;
    } else {
      console.log('No condition data found in the collection.');
      return null; // No condition data found
    }
  } catch (error) {
    console.error('Error fetching condition data:', error);
    throw new Error('Failed to retrieve box name.');
  }
};

/**
 * Function to save the box name as a metafield on the order.
 */
async function saveOrderMetafield(orderId, boxName, shopDomain, accessToken, timeout = 10000, retryCount = 3) {
  try {
    // @ts-ignore
    const client = new shopify.api.clients.Graphql({ session: { shop: shopDomain, accessToken } });

    const withTimeout = (promise, ms) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
        promise
          .then((res) => {
            clearTimeout(timer);
            resolve(res);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });
    };

    let attempts = 0;
    let success = false;

    while (attempts < retryCount && !success) {
      try {
        // GraphQL query to fetch existing metafields
        const query = `
          query {
            order(id: "gid://shopify/Order/${orderId}") {
              metafields(first: 10, namespace: "packwire") {
                edges {
                  node {
                    key
                    value
                  }
                }
              }
            }
          }
        `;

        const response = await withTimeout(client.query({ data: { query } }), timeout);
        let existingBoxName = '';
        const edges = response.body?.data?.order?.metafields?.edges || [];

        for (const edge of edges) {
          if (edge.node.key === 'packwire_box_name') {
            existingBoxName = edge.node.value;
            break;
          }
        }

        const updatedBoxName = existingBoxName !== '' ? `${existingBoxName}, ${boxName}` : boxName;

        // GraphQL mutation for updating/creating metafield
        const mutation = `
          mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields {
                key
                value
                namespace
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const variables = {
          metafields: [
            {
              namespace: 'packwire',
              key: 'packwire_box_name',
              value: updatedBoxName,
              type: 'multi_line_text_field',
              ownerId: `gid://shopify/Order/${orderId}`,
            },
          ],
        };

        const mutationResponse = await withTimeout(
          client.query({
            data: { query: mutation, variables },
          }),
          timeout
        );

        const userErrors = mutationResponse.body?.data?.metafieldsSet?.userErrors || [];
        if (userErrors.length) {
          throw new Error(`User errors: ${JSON.stringify(userErrors)}`);
        }

        console.log('Metafield updated/created successfully for order:', orderId);
        success = true;
      } catch (err) {
        attempts++;
        console.error(`Attempt ${attempts} failed for saving order metafield:`, err.message);

        if (attempts >= retryCount) {
          console.error(`Failed to save order metafield after ${retryCount} attempts`);
          throw err;
        }
      }
    }
  } catch (error) {
    console.error(`Error saving metafield for order ${orderId}:`, error.message);
    throw error;
  }
}

/**
 * Checks if the box is low in stock and sends an email alert if necessary.
 */
async function checkAndSendLowStockAlert(box, shopDomain) {
  const LowStockThreshold = 30;

  if (box.quantity < LowStockThreshold) {
    try {
      const storeInfo = await storeinformation.findOne({ shop_name: shopDomain }).exec();

      if (storeInfo?.emailalerts && Array.isArray(storeInfo.emailalerts)) {
        for (const email of storeInfo.emailalerts) {
          const replacements = {
            toEmail: email,
            boxName: box.boxName,
            quantity: box.quantity,
          };

          await sendEmailAlert(email, 'Low Stock Alert', './templates/low-quantity.html', replacements);
          console.log(`Low stock alert sent to ${email} for Box ${box.boxName}`);
        }
      }
    } catch (error) {
      console.error('Error sending low stock alert:', error.message);
    }
  }
}

/**
 * App Webhook for orders-cancel
 */
app.post('/webhook/orders/cancel', async (req, res) => {
  try {
    const orderData = req.body;
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const webhookId = req.headers['x-shopify-webhook-id'];
    const processedProducts = new Set(); // Track already processed products

    if (!webhookId || processedWebhooks.has(webhookId)) {
      console.log('Duplicate or invalid webhook, skipping processing');
      return res.status(400).send('Webhook invalid or already processed');
    }

    // Mark webhook as processed
    processedWebhooks.add(webhookId);

    // Validate shop domain
    if (!shopDomain) {
      console.log('Shop domain missing in headers');
      return res.status(400).send('Shop domain missing');
    }

    const storeInfo = await storeinformation.findOne({ shop_name: shopDomain }).exec();
    if (!storeInfo || !storeInfo.shop_accessToken) {
      console.log('Access token not found for shop:', shopDomain);
      return res.status(400).send('Access token missing');
    }

    const { shop_accessToken: accessToken, shop_name } = storeInfo;

    // Fetch matching box data
    const boxData = await getBoxNameBy(orderData.line_items, shop_name);
    console.log(boxData);
    if (boxData && boxData.box) {
      // Process matched box data
      await processCancelledMatchedBox(boxData, orderData, shopDomain, shop_name, accessToken);
    }

    if (boxData && boxData.unmatchedProductIds) {
      // Handle unmatched products in the order
      orderData.line_items = orderData.line_items.filter((item) =>
        boxData.unmatchedProductIds.includes(item.product_id)
      );
    }

    // Process unmatched boxes
    await processCancelledUnmatchedBoxes(orderData, shop_name, shopDomain, accessToken);

    res.status(200).send('Order cancelled and processed successfully');
  } catch (error) {
    console.error('Error processing cancellation webhook:', error.message);
    if (!res.headersSent) {
      return res.status(500).send('Error processing webhook');
    }
  }
});

// Helper function to process cancelled matched box data
const processCancelledMatchedBox = async (boxData, orderData, shopDomain, shop_name, accessToken) => {
  const boxDetails = await Boxcollection.findOne({
    _id: boxData.box,
    shop_name: shop_name,
  });

  if (boxDetails) {
    const matchedProductIdsSet = new Set(boxData.matchedProductIds);
    const matchedLineItems = orderData.line_items.filter((item) => matchedProductIdsSet.has(item.product_id));

    // Increase box quantity based on highest product quantity
    const highestQuantity = Math.max(...matchedLineItems.map((item) => item.quantity));
    const newQuantity = boxDetails.quantity + highestQuantity; // Adding the quantity back

    if (boxDetails.quantity !== newQuantity) {
      await Boxcollection.updateOne({ _id: boxDetails._id }, { $set: { quantity: newQuantity } });

      for (const item of matchedLineItems) {
        await historyLogSave(
          boxDetails._id,
          orderData.id,
          orderData.name,
          boxDetails.boxName,
          item.name,
          item.quantity,
          shopDomain,
          accessToken,
          'cancelled' // Log as 'cancelled'
        );
      }
    }
  }
};

// Helper function to process cancelled unmatched boxes
const processCancelledUnmatchedBoxes = async (orderData, shop_name, shopDomain, accessToken) => {
  for (const item of orderData.line_items) {
    const productId = String(item.product_id);
    const boxes = await Boxcollection.find({
      'selectedItems.productSelection.id': productId,
      shop_name: shop_name,
    });

    for (const box of boxes) {
      const newQuantity = box.quantity + item.quantity; // Adding the quantity back

      if (box.quantity !== newQuantity) {
        box.quantity = newQuantity;
        await box.save();

        await historyLogSave(
          box._id,
          orderData.id,
          orderData.name,
          box.boxName,
          item.name,
          item.quantity,
          shopDomain,
          accessToken,
          'cancelled' // Log as 'cancelled'
        );
      }
    }
  }
};

async function historyLogSave(
  boxID,
  orderID,
  orderName,
  boxName,
  ProductName,
  quantity,
  shop_name,
  shop_accessToken,
  status
) {
  // Initialize data as an object, not an array
  const data = {
    box_ID: boxID,
    order_ID: orderID,
    order_Name: orderName,
    boxName: boxName,
    ProductName: ProductName,
    quantity: quantity, // Assuming quantity is passed as an argument
    shop_name: shop_name,
    shop_accessToken: shop_accessToken,
    order_status: status,
  };

  try {
    // Save data to the historicaldata collection
    const response = await historicaldata.create(data);
    console.log('History log saved successfully');
  } catch (error) {
    console.error('Error saving history log:', error);
  }
}

app.use('/uploads', express.static(path.join(__dirname, 'packwires/web/uploads')));

const storage = multer.diskStorage({
  // @ts-ignore
  destination: (req, file, cb) => {
    const resolvedPath = path.join(__dirname, './uploads');
    console.log('Resolved Path:', resolvedPath); // Debugging line
    cb(null, resolvedPath);
  },
  // @ts-ignore
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

/**
 * File Upload fileSchema
 */
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = new filecollection({
      // @ts-ignore
      filename: req.file.filename,
      // @ts-ignore
      path: `/uploads/${req.file.filename}`, // Store the relative path
      // @ts-ignore
      size: req.file.size,
    });
    await file.save();
    res.status(200).json({ message: 'File uploaded successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'File upload failed', error });
  }
});

/**
 * Remove uploadded files
 */
app.delete('/api/remove-file/:id', async (req, res) => {
  try {
    // Find the file by ID
    const file = await filecollection.findById(req.params.id);

    if (file) {
      const filePath = path.join(__dirname, 'packwires/web/uploads', file.filename);

      // Check if file exists before attempting to delete
      if (fs.existsSync(filePath)) {
        console.log('Deleting file at:', filePath); // Debugging line
        fs.unlinkSync(filePath);
      } else {
        console.error('File not found at:', filePath); // Debugging line
      }

      // Remove the file from the database
      await filecollection.findByIdAndDelete(req.params.id);

      // Remove file reference from Boxcollection
      await Boxcollection.updateMany(
        { 'files.FileId': req.params.id },
        { $pull: { files: { FileId: req.params.id } } }
      );

      res.status(200).json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete file', error });
  }
});

/**
 * get Store location
 */
app.get('/api/locations', async (req, res) => {
  // Retrieve the boxID from the query parameters
  try {
    const session = res.locals.shopify.session;
    const response = await fetch(`https://${session.shop}/admin/api/2024-01/locations.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken,
      },
    });
    const responseData = await response.json();
    res.send({ success: true, response: responseData.locations });
  } catch (e) {
    console.error(`Failed to fetch box collections: ${e.message}`);
    res.status(500).send({ success: false, error: e.message });
  }
});

/**
 * create Boxcollection And update Boxcollection
 */
app.post('/api/boxcollection/submited', async (req, res) => {
  try {
    const data = req.body;
    data.shop_name = res.locals.shopify.session.shop;
    data.shop_accessToken = res.locals.shopify.session.accessToken;

    const session = res.locals.shopify.session;
    const productSelection = data.selectedItems.productSelection;
    let response;
    if (data._id) {
      response = await Boxcollection.updateOne({ _id: data._id }, { $set: data });
    } else {
      response = await Boxcollection.create(data);
    }
    // Loop through selected products and update their metafields
    for (const productId of productSelection) {
      await updateProductMetafield(session, productId.id, 'packwire_box_name', 'packwire', data.boxName);
    }
    res.send({ success: true, form: response });
  } catch (e) {
    console.error(`Failed to process products/submited: ${e.message}`);
    res.status(500).send({ success: false, error: e.message });
  }
});

// async function updateProductMetafield(session, productId, key, namespace, value) {
//   try {
//     const client = new shopify.api.clients.Graphql({ session });

//     // Query to get existing metafields
//     const query = `
//       query GetProductMetafields($id: ID!) {
//         product(id: $id) {
//           metafields(first: 100) {
//             edges {
//               node {
//                 id
//                 namespace
//                 key
//                 value
//               }
//             }
//           }
//         }
//       }
//     `;

//     const productIdFormatted = `gid://shopify/Product/${productId}`;
//     const existingMetafieldsResponse = await client.query({
//       data: {
//         query: query,
//         variables: { id: productIdFormatted },
//       },
//     });

//     // @ts-ignore
//     const metafields = existingMetafieldsResponse.body.data.product.metafields.edges;

//     const existingMetafield = metafields.find((edge) => edge.node.namespace === namespace && edge.node.key === key);

//     // If the metafield exists, update it
//     if (existingMetafield) {
//       const mutation = `
//         mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
//           metafieldsSet(metafields: $metafields) {
//             metafields {
//               id
//               key
//               value
//               namespace
//             }
//             userErrors {
//               field
//               message
//             }
//           }
//         }
//       `;

//       const variables = {
//         metafields: [
//           {
//             key: 'packwire_box_name',
//             value: value,
//             namespace: 'packwire',
//             type: 'single_line_text_field',
//             ownerId: productIdFormatted,
//           },
//         ],
//       };

//       const response = await client.query({
//         data: {
//           query: mutation,
//           variables: variables,
//         },
//       });
//     } else {
//       // If the metafield doesn't exist, create it
//       const mutation = `
//         mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
//           metafieldsSet(metafields: $metafields) {
//             metafields {
//               id
//               key
//               value
//               namespace
//             }
//             userErrors {
//               field
//               message
//             }
//           }
//         }
//       `;

//       const variables = {
//         metafields: [
//           {
//             namespace: namespace, // Required for creation
//             key: key, // Required for creation
//             value: value,
//             type: 'single_line_text_field',
//             ownerId: productIdFormatted, // Use ownerId for creation
//           },
//         ],
//       };

//       const response = await client.query({
//         data: {
//           query: mutation,
//           variables: variables,
//         },
//       });
//     }
//   } catch (error) {
//     console.error(`Error updating metafield for product ${productId}:`, error.message);
//   }
// }

async function updateProductMetafield(session, productId, key, namespace, value, timeout = 10000, retryCount = 3) {
  try {
    const client = new shopify.api.clients.Graphql({ session });
    // Helper function to add timeout to any promise
    const withTimeout = (promise, ms) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
        promise
          .then((res) => {
            clearTimeout(timer); // Clear the timeout if the request succeeds
            resolve(res);
          })
          .catch((err) => {
            clearTimeout(timer); // Clear the timeout on error
            reject(err);
          });
      });
    };
    let attempts = 0;
    let success = false;
    while (attempts < retryCount && !success) {
      try {
        // Query to get existing metafields
        const query = `
          query GetProductMetafields($id: ID!) {
            product(id: $id) {
              metafields(first: 100) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                  }
                }
              }
            }
          }
        `;
        const productIdFormatted = `gid://shopify/Product/${productId}`;
        const existingMetafieldsResponse = await withTimeout(
          client.query({
            data: {
              query: query,
              variables: { id: productIdFormatted },
            },
          }),
          timeout
        );
        const metafields = existingMetafieldsResponse.body.data.product.metafields.edges;
        const existingMetafield = metafields.find((edge) => edge.node.namespace === namespace && edge.node.key === key);
        // Mutation for updating or creating metafield
        const mutation = `
          mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields {
                id
                key
                value
                namespace
              }
              userErrors {
                field
                message
              }
            }
          }
        `;
        const variables = {
          metafields: [
            {
              namespace: existingMetafield ? namespace : namespace, // Use the correct namespace
              key: existingMetafield ? 'packwire_box_name' : key, // Use the correct key for update/create
              value: value,
              type: 'single_line_text_field',
              ownerId: productIdFormatted,
            },
          ],
        };
        const response = await withTimeout(
          client.query({
            data: {
              query: mutation,
              variables: variables,
            },
          }),
          timeout
        );
        const userErrors = response.body.data.metafieldsSet.userErrors || [];
        if (userErrors.length) {
          throw new Error(`User errors: ${JSON.stringify(userErrors)}`);
        }
        console.log('Metafield updated/created successfully');
        success = true; // Mark success as true if it reaches this point
      } catch (err) {
        attempts++;
        console.error(`Attempt ${attempts} failed for updating metafield:`, err.message);
        if (attempts >= retryCount) {
          console.error(`Failed to update metafield after ${retryCount} attempts`);
          throw err; // Re-throw the error if all retries fail
        }
      }
    }
  } catch (error) {
    console.error(`Error updating metafield for product ${productId}:`, error.message);
    throw error; // Rethrow the error after retries to be handled elsewhere
  }
}

/**
 * GET Boxcollection data
 */
app.get('/api/boxcollection/all', async (req, res) => {
  const { boxID } = req.query; // Retrieve the boxID from the query parameters
  try {
    let response;
    if (boxID) {
      // Fetch specific box based on boxID
      response = await Boxcollection.find({
        _id: boxID,
      }).exec();
    } else {
      // Fetch all box collections
      response = await Boxcollection.find({ shop_name: res.locals.shopify.session.shop }).exec();
    }

    res.send({ success: true, response });
  } catch (e) {
    console.error(`Failed to fetch box collections: ${e.message}`);
    res.status(500).send({ success: false, error: e.message });
  }
});

/**
 * Delete Boxcollection data
 */
app.post('/api/boxcollection/delete', async (req, res) => {
  try {
    const { deleteBoxID } = req.body;
    console.log('deleteBoxID', deleteBoxID);
    const response = await Boxcollection.deleteOne({
      shop_name: res.locals.shopify.session.shop,
      _id: deleteBoxID,
    });
    res.send({ success: true, response: response });
  } catch (e) {
    console.error(`Failed to process Boxcollection/get: ${e.message}`);
    res.status(500).send({ success: false, error: e.message });
  }
});

/**
 * POST save app settings
 */
app.post('/api/settings/save', async (req, res) => {
  try {
    const data = req.body;

    data.shop_name = res.locals.shopify.session.shop;
    data.shop_accessToken = res.locals.shopify.session.accessToken;

    let response;
    if (data._id) {
      response = await storeinformation.updateOne({ _id: data._id }, { $set: data });
    } else {
      response = await storeinformation.create(data);
    }

    res.send({ success: true, response });
  } catch (e) {
    console.error(`Failed to fetch box collections: ${e.message}`);
    res.status(500).send({ success: false, error: e.message });
  }
});

/**
 * GET Historical data
 */
app.post('/api/Historicaldata/all', async (req, res) => {
  const { date } = req.body; // Retrieve the date range from the request body
  const { since, until } = date || {}; // Destructure the since and until dates from date

  try {
    // Query to fetch 'created' orders
    const query = {
      shop_name: res.locals.shopify.session.shop,
      order_status: 'created',
    };

    // Apply date range filter if provided
    if (since && until) {
      const sinceDate = new Date(new Date(since).setUTCHours(0, 0, 0, 0)); // Start of the day
      const untilDate = new Date(new Date(until).setUTCHours(23, 59, 59, 999)); // End of the day
      query.createdAt = {
        $gte: sinceDate,
        $lte: untilDate,
      };
    }

    // Fetch created orders
    const response = await historicaldata.find(query).exec();

    // Query to fetch 'cancel' orders
    const canquery = {
      shop_name: res.locals.shopify.session.shop,
      order_status: 'cancelled',
    };

    // Apply date range filter if provided
    if (since && until) {
      const sinceDate = new Date(new Date(since).setUTCHours(0, 0, 0, 0)); // Start of the day
      const untilDate = new Date(new Date(until).setUTCHours(23, 59, 59, 999)); // End of the day
      canquery.createdAt = {
        $gte: sinceDate,
        $lte: untilDate,
      };
    }

    // Fetch canceled orders
    const canresponse = await historicaldata.find(canquery).exec();

    // Create a Set of order_IDs from the canceled orders for quick lookup
    const canceledOrderIds = new Set(canresponse.map((order) => order.order_ID));

    // Filter out any orders in 'response' that have an order_ID in the canceled orders
    const filteredResponse = response.filter((order) => !canceledOrderIds.has(order.order_ID));

    let totalQuantity = 0;
    const boxUsage = {};
    filteredResponse.forEach((order) => {
      totalQuantity += order.quantity; // Assuming 'quantity' is a number in each order

      const boxId = order.box_ID; // Assuming 'box_ID' is the key for the box identifier
      const boxName = order.boxName; // Assuming 'box_name' is available in the order data

      if (!boxUsage[boxId]) {
        boxUsage[boxId] = {
          name: boxName,
          totalQuantity: 0,
        };
      }

      boxUsage[boxId].totalQuantity += order.quantity; // Sum up the quantity for each box
    });

    // Convert boxUsage object to an array for easier manipulation
    const boxUsageArray = await Promise.all(
      Object.keys(boxUsage).map(async (boxId) => {
        // Fetch the current box quantity from the database
        const boxData = await Boxcollection.findOne({ _id: boxId }).exec();

        // Ensure that boxData exists and return the desired object
        return {
          box_ID: boxId,
          box_name: boxUsage[boxId].name, // Name from boxUsage
          totalQuantity: boxUsage[boxId].totalQuantity, // Total quantity from boxUsage
          currentQuantity: boxData?.quantity || 0, // Fetched current box quantity, default to 0 if not found
        };
      })
    );

    // Find the box with the highest quantity
    let mostUsedBox = { name: null, totalQuantity: 0 };

    for (const boxId in boxUsage) {
      if (boxUsage[boxId].totalQuantity > mostUsedBox.totalQuantity) {
        mostUsedBox = boxUsage[boxId];
      }
    }
    const mergedResponse = [...filteredResponse, ...canresponse];

    // Send the filtered response
    res.send({
      success: true,
      response: mergedResponse,
      completed: filteredResponse.length, // Shows how many orders remain after filtering
      cancel: canresponse.length, // Optional: shows original count of created orders
      totalQuantity: totalQuantity,
      mostUsedBox: mostUsedBox,
      boxUsageArray: boxUsageArray,
    });
  } catch (e) {
    console.error(`Failed to fetch historical data: ${e.message}`);
    res.status(500).send({ success: false, error: e.message });
  }
});

/**
 * Import box collections csv file
 */
app.post('/api/import-box-collections', async (req, res) => {
  try {
    const csvData = req.body.data;
    const session = res.locals.shopify.session;

    // Initialize response array to collect results from the database
    const responses = [];

    // Loop through each data entry to create box collections in the database
    for (const data of csvData) {
      // Ensure productSelection is an array
      const productSelection = data.selectedItems?.productSelection || [];
      data.shop_name = session.shop;
      data.shop_accessToken = session.accessToken;

      for (let i = 0; i < productSelection.length; i++) {
        const sku = productSelection[i];
        const productId = await getIdBySku(sku, data.shop_name, data.shop_accessToken);

        if (productId) {
          // Replace the SKU with an object that contains both productId and sku
          data.selectedItems.productSelection[i] = {
            id: productId.split('/').pop(), // Extract only the product ID
            sku: sku,
          };
        } else {
          console.warn(`No product found for SKU: ${sku}`);
        }
      }
      console.log(data);
      // Create box collection and push response into the array
      const response = await Boxcollection.create(data);
      responses.push(response);

      // Loop through selected products and update their metafields
      for (const productId of productSelection) {
        await updateProductMetafield(session, productId.id, 'packwire_box_name', 'packwire', data.boxName);
      }
    }

    // Send success response with all created box collections
    res.json({ success: true, message: 'Data imported successfully!', form: responses });
  } catch (error) {
    console.error('Error importing box collections:', error);
    res.status(500).json({ success: false, message: 'Failed to import data', error: error.message });
  }
});

async function getIdBySku(sku, store_name, apiAccessToken) {
  const url = `https://${store_name}/admin/api/2024-07/graphql.json`;
  const query = `{
    products(first: 1, query: "sku:${sku}") {
      edges {
        node {
          id
        }
      }
    }
  }`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': apiAccessToken,
      },
      body: JSON.stringify({ query }),
      timeout: 10000,
    });

    const data = await response.json();

    // Check if products are found
    const product = data?.data?.products?.edges?.[0]?.node;

    if (!product) {
      console.warn(`No product found with SKU: ${sku}`);
      return null;
    }
    return product.id;
  } catch (error) {
    console.error(`Failed to fetch product ID for SKU ${sku}:`, error);
    return null;
  }
}

/**
 * POST save Box Condition settings
 */
app.post('/api/Conditions/save', async (req, res) => {
  try {
    const data = req.body;

    const shopName = res.locals.shopify.session.shop;
    const accessToken = res.locals.shopify.session.accessToken;

    // Ensure the shop information is added to the data
    data.shop_name = shopName;
    data.shop_accessToken = accessToken;

    const response = await Conditioncollection.findOneAndUpdate(
      { shop_name: shopName, shop_accessToken: accessToken }, // Query to find the document
      data, // New data to update or insert
      {
        new: true, // Return the modified document after update
        upsert: true, // Create a new document if no match is found
      }
    );

    res.send({ success: true, response });
  } catch (e) {
    console.error(`Failed to fetch box collections: ${e.message}`);
    res.status(500).send({ success: false, error: e.message });
  }
});

/**
 * POST Box Condition settings
 */
app.get('/api/Conditions/fetch', async (req, res) => {
  try {
    const shopName = res.locals.shopify.session.shop;
    const accessToken = res.locals.shopify.session.accessToken;

    // Ensure both shop_name and shop_accessToken are being used in the query correctly
    const conditionsData = await Conditioncollection.find({
      shop_name: shopName,
      shop_accessToken: accessToken,
    }).exec();

    if (conditionsData.length === 0) {
      return res.status(404).send({ error: 'No conditions found for this shop.' });
    }

    // Prepare the response data
    const responseData = {
      condition: conditionsData[0].condition,
      shopName: conditionsData[0].shop_name,
    };
    // Send the fetched conditions data
    res.status(200).send(responseData);
  } catch (error) {
    console.error('Error fetching conditions:', error.message);
    res.status(500).send({ error: 'Failed to retrieve conditions.' });
  }
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use('/*', shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .send(readFileSync(join(STATIC_PATH, 'index.html')));
});
