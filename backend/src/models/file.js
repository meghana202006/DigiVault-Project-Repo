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
    enum: ['image', 'video', 'document', 'audio','private'], 
    required: true 
  },
  security:{
    wrappedKey: {
      type: [Number],
      required:true
  },
  masterIV: {
    type: [Number],
    required: false
  },
  },
  url: {
    type: String,
    required: true
    }, 
  
  createdAt: { type: Date, default: Date.now }
});

// Check if 'File' already exists. If yes, reuse it. If no, create it.
module.exports = mongoose.models.File || mongoose.model('File', fileSchema);