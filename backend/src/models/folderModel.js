const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name:{
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    sectionType:{
        type: String,
        required: true,
        enum: ['Documents', 'Images', 'Audio', 'Videos', 'Private'],
        index: true
    },
    megaNodeId:{
        type: String,
        required: false,
    },
    parentNodeId:{
        type: String,
        ref:'Folder',
        required: false,
        default: null
    },

    createdAt:{
        type: Date,
        default: Date.now
    }
})

// Compound unique index: same folder name can exist for different users or sections,
// but not for the same user in the same section
folderSchema.index({ user: 1, name: 1, sectionType: 1 }, { unique: true });

module.exports = mongoose.models.Folder || mongoose.model('Folder', folderSchema);