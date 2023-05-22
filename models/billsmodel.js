const mongoose = require('mongoose');

let billsSchema = new mongoose.Schema({
    title : { type : String, required : true },
    description : String,
    month : { type : String, required : true },
    year : { type : String, required : true },
    image : { type : String, required : true }, 
    created : { type : Date, required : true, default : Date.now }
});

let reportsSchema = new mongoose.Schema({
    title : { type : String, required : true },
    month : { type : String, required : true },
    year : { type : String, required : true },
    file: {data: Buffer, contentType: String}, 
    created : { type : Date, required : true, default : Date.now }
});

module.exports = {
    Bill: mongoose.model('Bill', billsSchema),
    Report: mongoose.model('Report', reportsSchema)
};
