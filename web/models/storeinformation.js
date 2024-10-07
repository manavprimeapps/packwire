import mongoose from 'mongoose';

const storeinformationsSchcema = new mongoose.Schema({
  condition: {
    type: Array,
    required: true,
  },
  emailalerts: {
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

const storeinformation = mongoose.model('Storeinformation', storeinformationsSchcema);

export default storeinformation;
