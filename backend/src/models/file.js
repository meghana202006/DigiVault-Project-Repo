const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  name: {
    type: String,
    required: true
    },
  
  originalName: {
    type: String,
    required: true
    },
  
  mimeType: {
    type: String,
    required: true
    },
  
  size: {
    type: Number,
    required: true
    },
  
  fileType: { 
    type: String, 
    enum: ['image', 'video', 'document', 'other'], 
    required: true 
  },

  url: {
    type: String,
    required: true
    }, 
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);