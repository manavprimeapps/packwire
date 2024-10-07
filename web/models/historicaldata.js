import mongoose from 'mongoose';

const historicaldataSchcema = new mongoose.Schema({
  box_ID: {
    type: String,
    required: true,
  },
  order_ID: {
    type: String,
    required: true,
  },
  order_Name: {
    type: String,
    required: true,
  },
  boxName: {
    type: String,
    required: true,
  },
  ProductName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  shop_name: {
    type: String,
    required: true,
  },
  shop_accessToken: {
    type: String,
    required: true,
  },
  order_status: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const historicaldata = mongoose.model('Historicaldata', historicaldataSchcema);

export default historicaldata;
