const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const flash = require("connect-flash");

const Detail = require("../models/detailsmodel");
const detailSchema = require("../models/detailsmodel").schema;
const DetailModel = mongoose.model("Detail", detailSchema);

// const Detail = require("../models/details");
const Stipend = require("../models/stipendmodel");

// Middleware for super admin
function requireSuperAdmin(req, res, next) {
  if (req.user && req.user.role === 'super admin') {
    return next();
  } else {
    req.flash("error_msg", "You are unauthorized");
  }
}

// Check is user is authenticated
function isAuthenticatedUser(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error_msg", "Please Login first to access this page.");
  res.redirect("/login");
}

router.post("/details", isAuthenticatedUser, async function (req, res) {
  const item = req.body.item;
  const quantity = req.body.quantity;
  const rate = req.body.rate;
  const purchasedate = new Date(req.body.purchasedate);
  const data = await detailsData();


  const amount = quantity * rate;

  const datepickerValue = req.body.datepicker;

  // Parse the datepicker value into a Date object
  const selectedDate = new Date(datepickerValue);

  // Extract the month and year values from the Date object
  const smonth = selectedDate.getMonth() + 1; // add 1 because getMonth() returns a zero-based index
  const syear = selectedDate.getFullYear();

  // Find the details for the specified month and year
  const details = await Detail.find({
    purchasedate: {
      $gte: new Date(purchasedate.getFullYear(), purchasedate.getMonth(), 1),
      $lte: new Date(purchasedate.getFullYear(), purchasedate.getMonth() + 1, 0),
    },
  }).sort({ purchasedate: -1, createdAt: -1 }); // sort by purchasedate and createdAt in descending order


  // Retrieve the stipend for the specified month and year
  const stipend = await Stipend.findOne({
    date: {
      $gte: new Date(purchasedate.getFullYear(), purchasedate.getMonth(), 1),
      $lte: new Date(purchasedate.getFullYear(), purchasedate.getMonth() + 1, 0),
    },
  });

  if (!stipend) {
    req.flash("error_msg", "No stipend found for this specified month and year. Please add a stipend first.");
    res.redirect("/details");
    return;
  }

  // Initialize totalAmount to the total from the stipend collection
  let totalAmount = stipend.stipendin;

  // Update the balance for each detail by subtracting the amount from the totalAmount
  for (let j = 0; j < details.length; j++) {
    totalAmount -= details[j].amount;
    details[j].balance = totalAmount;
    await details[j].save();
  }

  // Calculate the useAmount for the new detail
  // Sort details by purchasedate in descending order
  details.sort((a, b) => b.purchasedate - a.purchasedate);

  // Calculate the useAmount for each detail in descending order of purchasedate
  let useAmount = 0;
  for (let j = 0; j < details.length; j++) {
    useAmount += details[j].amount;
    details[j].useamount = useAmount;
    await details[j].save();
  }


  const detail = new Detail({
    purchasedate: req.body.purchasedate,
    memo: req.body.memo,
    vendor: req.body.vendor,
    item: item,
    quantity: quantity,
    rate: rate,
    amount: amount,
    unit: req.body.unit,
    jrlno: req.body.jrlno,
    balance: totalAmount - amount,
    useamount: useAmount + amount, // Calculate the balance for the new detail
  });

  try {
    await detail.save();
    req.flash("success_msg", "Detail has been successfully added.");
    res.redirect("/details");
    return;

    // Sort all details by purchasedate and createdAt in descending order, with latest entries first
    const allDetails = await Detail.find({}).sort({ purchasedate: -1, createdAt: -1 });
    const latestDetails = [];

    // Push latest entry to the top, and sort by latest date, month, and year within those entries
    for (let i = 0; i < allDetails.length; i++) {
      if (allDetails[i].purchasedate.toDateString() === detail.purchasedate.toDateString()) {
        latestDetails.unshift(allDetails[i]);
      } else {
        latestDetails.push(allDetails[i]);
      }
    }
    latestDetails.sort((a, b) => b.purchasedate - a.purchasedate || b.createdAt - a.createdAt);

    res.render("details", {
      details: latestDetails,
      data,
      smonth: smonth,
      syear: syear,
      detail:detail,
    });
  } catch (err) {
    console.log(err);
  }
});

async function detailsData(month, year) {
  let query = {};
  if (month && year) {
    query = {
      purchasedate: {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0),
      },
    };
  }
  const details = await Detail.find(query);

  const latestStipend = await Stipend.findOne(
    {},
    { stipend: 1, cutstipend: 1, stipendin: 1, total: 1 }
  ).sort({ _id: -1 }).limit(1);
  const stipendTotal = latestStipend ? latestStipend.total : 0;
  const stipendIn = latestStipend ? latestStipend.stipendin : null;
  const lastDetail = details[details.length - 1];
  const balance = lastDetail ? lastDetail.balance : stipendTotal;
  const useAmount = lastDetail ? lastDetail.useamount : 0;
  const date = lastDetail
    ? lastDetail.purchasedate
    : new Date(year, month - 1, 1);

  const data = {
    date: date.toLocaleDateString(),
    details: details,
    balance: balance,
    useAmount: useAmount,
    total: stipendTotal,
    stipendin: stipendIn,
    stipend: latestStipend ? latestStipend.stipend : 0,
    cutstipend: latestStipend ? latestStipend.cutstipend : 0,
  };
  return data;
}

router.get('/details', isAuthenticatedUser, async (req, res) => {
  try {
    // Find the latest detail
    const data = await detailsData();
    const details = await Detail.find({}).sort({ purchasedate: -1 });
    const latestDetails = await Detail.find({}).sort({ purchasedate: -1 }).limit(1);
    const latestStipend = await Stipend.findOne({}, { stipend: 1, cutstipend: 1, stipendin: 1, total: 1 }).sort({ _id: -1 }).limit(1);

    let balance = latestStipend ? latestStipend.total : 0;
    let useAmount = 0;

    const datepickerValue = req.body.datepicker;
    const detail = req.params.id ? await Detail.findById(req.params.id) : { purchasedate: '', vendor: '', category: '', item: '', unit: '', price: '', quantity: '', total: '', balance: '', useamount: '' };

    // Parse the datepicker value into a Date object
    const selectedDate = new Date(datepickerValue);

    // Extract the month and year values from the Date object
    const smonth = selectedDate.getMonth() + 1; // add 1 because getMonth() returns a zero-based index
    const syear = selectedDate.getFullYear();

    // Find the latest record of balance and useamount
    const latestBalance = await Detail.findOne({ balance: { $exists: true } }).sort({ purchasedate: -1 });
    const latestUseAmount = await Detail.findOne({ useamount: { $exists: true } }).sort({ purchasedate: -1 });

    // Use the latest balance and useamount values, if they exist
    if (latestBalance) {
      balance = latestBalance.balance;
    }
    if (latestUseAmount) {
      useAmount = latestUseAmount.useamount;
    }

    // Extract unique months and years from the filtered details
    const months = new Set();
    const years = new Set();
    latestDetails.forEach(detail => {
      const detailDate = new Date(detail.purchasedate);
      const month = (detailDate.getMonth() + 1).toString().padStart(2, '0');
      const year = detailDate.getFullYear().toString();
      const dateString = `${year}-${month}`;
      months.add(month);
      years.add(year);
      detail.purchasedate = dateString;
    });

    // Find the latest month and year
    const latestMonth = Array.from(months).reduce((latest, current) => {
      if (latest === null) {
        return current;
      }
      return current > latest ? current : latest;
    }, null);
    const latestYear = Array.from(years).reduce((latest, current) => {
      if (latest === null) {
        return current;
      }
      return current > latest ? current : latest;
    }, null);

    // Filter the details by the latest month and year
    const filteredDetails = latestDetails.filter(detail => {
      const detailDate = new Date(detail.purchasedate);
      const detailMonth = (detailDate.getMonth() + 1).toString().padStart(2, '0');
      const detailYear = detailDate.getFullYear().toString();
      return detailMonth === latestMonth && detailYear === latestYear;
    });

    res.render('details', {
      details: details,
      detail: detail,
      balance: balance,
      smonth: smonth,
      syear: syear,
      date: new Date(syear, smonth - 1, 1).toLocaleDateString(),
      data,
    });
  } catch (err) {
    console.log(err);
  }
});

// Details on users page
router.get('/udetails', isAuthenticatedUser, async (req, res) => {
  try {
    // Find the latest detail
    const data = await detailsData();
    const details = await Detail.find({}).sort({ purchasedate: -1 });
    const latestDetails = await Detail.find({}).sort({ purchasedate: -1 }).limit(1);
    const latestStipend = await Stipend.findOne({}, { stipend: 1, cutstipend: 1, stipendin: 1, total: 1 }).sort({ _id: -1 }).limit(1);

    let balance = latestStipend ? latestStipend.total : 0;
    let useAmount = 0;

    const datepickerValue = req.body.datepicker;
    const detail = req.params.id ? await Detail.findById(req.params.id) : { purchasedate: '', vendor: '', category: '', item: '', unit: '', price: '', quantity: '', total: '', balance: '', useamount: '' };

    // Parse the datepicker value into a Date object
    const selectedDate = new Date(datepickerValue);

    // Extract the month and year values from the Date object
    const smonth = selectedDate.getMonth() + 1; // add 1 because getMonth() returns a zero-based index
    const syear = selectedDate.getFullYear();

    // Find the latest record of balance and useamount
    const latestBalance = await Detail.findOne({ balance: { $exists: true } }).sort({ purchasedate: -1 });
    const latestUseAmount = await Detail.findOne({ useamount: { $exists: true } }).sort({ purchasedate: -1 });

    // Use the latest balance and useamount values, if they exist
    if (latestBalance) {
      balance = latestBalance.balance;
    }
    if (latestUseAmount) {
      useAmount = latestUseAmount.useamount;
    }

    // Extract unique months and years from the filtered details
    const months = new Set();
    const years = new Set();
    latestDetails.forEach(detail => {
      const detailDate = new Date(detail.purchasedate);
      const month = (detailDate.getMonth() + 1).toString().padStart(2, '0');
      const year = detailDate.getFullYear().toString();
      const dateString = `${year}-${month}`;
      months.add(month);
      years.add(year);
      detail.purchasedate = dateString;
    });

    // Find the latest month and year
    const latestMonth = Array.from(months).reduce((latest, current) => {
      if (latest === null) {
        return current;
      }
      return current > latest ? current : latest;
    }, null);
    const latestYear = Array.from(years).reduce((latest, current) => {
      if (latest === null) {
        return current;
      }
      return current > latest ? current : latest;
    }, null);

    // Filter the details by the latest month and year
    const filteredDetails = latestDetails.filter(detail => {
      const detailDate = new Date(detail.purchasedate);
      const detailMonth = (detailDate.getMonth() + 1).toString().padStart(2, '0');
      const detailYear = detailDate.getFullYear().toString();
      return detailMonth === latestMonth && detailYear === latestYear;
    });

    res.render('udetails', {
      details: details,
      detail: detail,
      balance: balance,
      smonth: smonth,
      syear: syear,
      date: new Date(syear, smonth - 1, 1).toLocaleDateString(),
      data,
    });
  } catch (err) {
    console.log(err);
  }
});

router.post('/details/search', isAuthenticatedUser, async (req, res) => {
  try {
    const smonth = req.body.smonth;
    const syear = req.body.syear;
    const data = await detailsData(smonth, syear);
    const detail = req.params.id ? await Detail.findById(req.params.id) : { purchasedate: '', vendor: '', category: '', item: '', unit: '', price: '', quantity: '', total: '', balance: '', useamount: '' };


    // Find details that fall within the specified date range
    const details = await Detail.find({
      purchasedate: {
        $gte: new Date(syear, smonth - 1, 1),
        $lt: new Date(syear, smonth, 0)
      }
    });

    const totalAmount = details.reduce((total, detail) => total + detail.amount, 0);
    const useAmount = data.useAmount.toLocaleString();

    res.render('details', {
      details: details,
      totalAmount: totalAmount.toLocaleString(),
      useAmount: useAmount,
      smonth: smonth,
      syear: syear,
      data: data,
      detail: detail,
      stipendError: req.flash("stipenderror"),
      detailadd: req.flash("detailadd"),
      closingerror: req.flash("closingerror"),
      detailclose: req.flash("detailclose"),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal server error');
  }
});

// Search for the details in users side
router.post('/udetails/search', isAuthenticatedUser, async (req, res) => {
  try {
    const smonth = req.body.smonth;
    const syear = req.body.syear;
    const data = await detailsData(smonth, syear);
    const detail = req.params.id ? await Detail.findById(req.params.id) : { purchasedate: '', vendor: '', category: '', item: '', unit: '', price: '', quantity: '', total: '', balance: '', useamount: '' };


    // Find details that fall within the specified date range
    const details = await Detail.find({
      purchasedate: {
        $gte: new Date(syear, smonth - 1, 1),
        $lt: new Date(syear, smonth, 0)
      }
    });

    const totalAmount = details.reduce((total, detail) => total + detail.amount, 0);
    const useAmount = data.useAmount.toLocaleString();

    res.render('udetails', {
      details: details,
      totalAmount: totalAmount.toLocaleString(),
      useAmount: useAmount,
      smonth: smonth,
      syear: syear,
      data: data,
      detail: detail,
      stipendError: req.flash("stipenderror"),
      detailadd: req.flash("detailadd"),
      closingerror: req.flash("closingerror"),
      detailclose: req.flash("detailclose"),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal server error');
  }
});

module.exports = router;
