import mongoose from 'mongoose';

const filecollectionsSchcema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const filecollection = mongoose.model('Filecollection', filecollectionsSchcema);

export default filecollection;
