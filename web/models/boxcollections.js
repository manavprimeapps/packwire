import mongoose from 'mongoose';

const dimensionsSchema = new mongoose.Schema({
  Height: { type: Number },
  Width: { type: Number },
  Depth: { type: Number },
});

const flatDimensionsSchema = new mongoose.Schema({
  Height: { type: Number },
  Width: { type: Number },
});

const selectedItemsSchema = new mongoose.Schema({
  productSelection: [
    {
      id: { type: String, required: true }, // Assuming 'id' is a string (e.g., product ID)
      sku: { type: String }, // Assuming 'sku' is a string
    },
  ],
  collectionSelection: [{ type: Array }],
});

const boxcollectionsSchema = new mongoose.Schema({
  insidedimensions: [dimensionsSchema],
  flatdimensions: [flatDimensionsSchema],
  outsidedimensions: [dimensionsSchema],
  boxName: {
    type: String,
    required: [true, 'Box Name is Required'],
  },
  packagingtype: {
    type: String,
    required: [true, 'Packaging type is Required'],
  },
  subtype: {
    type: String,
    required: [true, 'Sub-type is Required'],
  },
  selectedItems: selectedItemsSchema,
  quantity: {
    type: Number, // Changed from String to Number
    required: [true, 'Quantity is Required'],
  },
  suppliername: {
    type: String,
    required: [true, 'Supplier name is Required'],
  },
  contactinfo: {
    type: String,
    required: [true, 'Contact info is Required'],
  },
  leadtimes: {
    type: String,
    required: [true, 'Lead times is Required'],
  },
  warehouseLocation: {
    type: String,
    required: [true, 'Warehouse Location is Required'],
  },
  weight: {
    type: String,
    required: [true, 'Weight is Required'],
  },
  cost: {
    type: String,
    required: [true, 'Cost is Required'],
  },
  files: {},
  shop_name: {
    type: String,
    required: [true, 'Shop name is Required'],
  },
  shop_accessToken: {
    type: String,
    required: [true, 'Shop access token is Required'],
  },
});

const Boxcollection = mongoose.model('Boxcollection', boxcollectionsSchema);

export default Boxcollection;
