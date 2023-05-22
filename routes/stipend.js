const express = require("express");
const router = express.Router();
const flash = require("connect-flash");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");

const Detail = require("../models/detailsmodel");
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

router.post("/stipends", isAuthenticatedUser, async function (req, res) {
  const rate = req.body.rate;
  const quantity = req.body.quantity;
  const students = req.body.students;
  const stipend = req.body.stipend;
  const cutstipend = req.body.cutstipend;

  const amount = rate * quantity;
  const total = students * stipend;
  const stipendin = students * cutstipend;

  const date = new Date(req.body.date);
  const month = date.getMonth() + 1; // Month is zero-indexed, so add 1 to get the actual month
  const year = date.getFullYear();

  // Retrieve the topItems for the latest month and year
  const latestDetail = await Detail.findOne({}, { purchasedate: 1 }).sort({ purchasedate: -1 }).limit(1);
  const latestMonth = latestDetail ? latestDetail.purchasedate.getMonth() + 1 : new Date().getMonth() + 1;
  const latestYear = latestDetail ? latestDetail.purchasedate.getFullYear() : new Date().getFullYear();

  const queryLatestMonth = {
    purchasedate: {
      $gte: new Date(latestYear, latestMonth - 1, 1),
      $lte: new Date(latestYear, latestMonth, 0),
    },
  };

  const detailsLatestMonth = await Detail.find(queryLatestMonth);

  const itemAmounts = {};
  for (const detail of detailsLatestMonth) {
    const item = detail.item;
    const amount = detail.amount;

    if (!itemAmounts[item]) {
      itemAmounts[item] = 0;
    }

    itemAmounts[item] += amount;
  }

  const sortedItems = Object.entries(itemAmounts).sort((a, b) => b[1] - a[1]);
  const topItems = sortedItems.slice(0, 5);

  // Check if an entry already exists for this month and year
  const existingStipend = await Stipend.findOne({ month: month, year: year });
  if (existingStipend && existingStipend.month === month && existingStipend.year === year) {
    // If an entry already exists, check if the month and year match. If yes, return an error message
    req.flash("error_msg", "Stipend entry for this month is already exist. Please reconfirm the month and make entry");
    res.redirect("/admindash");
    return;
  }

  const stipends = new Stipend({
    date: req.body.date,
    students: req.body.students,
    stipend: req.body.stipend,
    cutstipend: req.body.cutstipend,
    total: total,
    stipendin: stipendin,
    month: month,
    year: year
  });

  try {
    await stipends.save();
    const allStipends = await Stipend.find({}).sort({ id: -1 }).limit(12);

    // Render the admin dashboard view with the updated stipends and topItems data
    req.flash('success_msg', 'Stipend added Successfully!');
    res.render("admindash", {
      stipends: allStipends,
      topItems: topItems,
      data: await getReportData(),
      month: month,
      year: year,
    });
    
  } catch (err) {
    req.flash("error_msg", "An error occurred while saving the stipend.");
    console.log(err);
    res.redirect("/admindash");
  }
});

// REPORT Parts START
async function getReportData(month, year) {
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

  if (details.length === 0) {
    throw new Error(
      `No data found for month ${month} and year ${year} to generate the report. Please make sure to have details entry first`
    );
  }

  const stipendQuery = month && year ? { month: month, year: year } : {};
  const latestStipend = await Stipend.findOne(
    stipendQuery,
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

router.get("/makeReport", isAuthenticatedUser, async (req, res) => {
  try {
    const details = await Detail.find();

    const month = req.query.month;
    const year = req.query.year;

    const data = await getReportData(month, year);

    // Add month and year variables to data object
    data.month = month;
    data.year = year;

    res.render("makeReport", {
      details: details,
      month: month,
      year: year,
      data: data, // Convert the data object to a JSON string
    });
  } catch (err) {
    req.flash("error_msg", `${err.message}`);
    res.redirect("/makeReport");
  }
});


module.exports = router;
