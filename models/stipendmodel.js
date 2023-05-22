const mongoose = require("mongoose");

const stipendSchema = new mongoose.Schema({
  date: {
    type: Date,
  },
  students: {
    type: Number,
  },
  stipend: {
    type: Number,
  },
  cutstipend: {
    type: Number,
  },
  total: {
    type: Number,
  },
  stipendin: {
    type: Number,
  },
  balance: {
    type: Number,
  },
  detail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Detail",
  },
  month: {
    type: Number,
  },
  year: {
    type: Number,
  },
});

const Stipend = mongoose.model("Stipend", stipendSchema);

module.exports = Stipend;
