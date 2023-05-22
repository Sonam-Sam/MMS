const mongoose = require("mongoose");

const detailSchema = new mongoose.Schema({
  purchasedate: {
    type: Date,
  },
  memo: {
    type: String,
  },
  vendor: {
    type: String,
  },
  item: {
    type: String,
  },
  quantity: {
    type: mongoose.Schema.Types.Number,
  },
  rate: {
    type: mongoose.Schema.Types.Number,
  },
  amount: {
    type: mongoose.Schema.Types.Number,
  },
  unit: {
    type: String,
  },
  jrlno: {
    type: String,
  },
  balance: {
    type: mongoose.Schema.Types.Number,
  },
  useamount: {
    type: mongoose.Schema.Types.Number,
  },
  editable: {
    type: Boolean,
    default: true
  },
  month: {
    type: Number,
  },
  year: {
    type: Number,
  }
});

module.exports = mongoose.model("Detail", detailSchema);
