import mongoose from 'mongoose';

const conditioncollectionsSchcema = new mongoose.Schema({
  condition: {
    type: Array,
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
});

const Conditioncollection = mongoose.model('Conditioncollection', conditioncollectionsSchcema);

export default Conditioncollection;
