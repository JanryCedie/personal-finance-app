const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['credit', 'debit']
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Rename _id to id when converting to JSON to match frontend expectations if necessary
transactionSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
        delete ret._id;
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
