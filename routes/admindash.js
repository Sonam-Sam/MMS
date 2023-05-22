
const express = require("express");
const router = express.Router();
const flash = require('connect-flash');

const Detail = require("../models/detailsmodel");
const Stipend = require("../models/stipendmodel");
const User = require("../models/usermodel");

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


async function getReportData(month = new Date().getMonth() + 1, year = new Date().getFullYear()) {
  const query = {
    purchasedate: {
      $gte: new Date(year, month - 1, 1),
      $lte: new Date(year, month, 0),
    },
  };

  const details = await Detail.find(query);

  // if (details.length === 0) {
  //   throw new Error("No data found in the database.")
  // }

  const latestStipend = await Stipend.findOne(
    {},
    { stipend: 1, cutstipend: 1, stipendin: 1, total: 1 }
  ).sort({ _id: -1 }).limit(1);
  const stipendTotal = latestStipend ? latestStipend.total : 0;
  const stipendIn = latestStipend ? latestStipend.stipendin : null;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const currentMonthDetails = await Detail.find({
    purchasedate: {
      $gte: new Date(currentYear, currentMonth - 1, 1),
      $lte: new Date(currentYear, currentMonth, 0),
    }
  });

  const lastDetail = currentMonthDetails[currentMonthDetails.length - 1];
  const balance = lastDetail ? lastDetail.balance : stipendTotal;
  const useAmount = lastDetail ? lastDetail.useamount : 0;
  const date = lastDetail
    ? lastDetail.purchasedate
    : new Date(year, month - 1, 1);

  const data = {
    date: date.toLocaleDateString(),
    details: currentMonthDetails,
    balance: balance,
    useAmount: useAmount,
    total: stipendTotal,
    stipendin: stipendIn,
    stipend: latestStipend ? latestStipend.stipend : 0,
    cutstipend: latestStipend ? latestStipend.cutstipend : 0,
  };
  return data;
}

router.get("/admindash", isAuthenticatedUser, async function (req, res) {
  try {
    const month = req.query.month;
    const year = req.query.year;
    const data = await getReportData(month, year);
    const allStipends = await Stipend.find({}).sort({ _id: -1 }).limit(12);
    // Find all users except for super admins
    const users = await User.find({  status: "active" }).exec();


    // Add month and year variables to data object
    data.month = month;
    data.year = year;

    // Extract the latest month and year from the details collection
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


    // Group items and sum their amounts for the latest month and year
    const itemAmounts = {};
    for (const detail of detailsLatestMonth) {
      const item = detail.item;
      const amount = detail.amount;

      if (!itemAmounts[item]) {
        itemAmounts[item] = 0;
      }

      itemAmounts[item] += amount;
    }

    // Sort the items based on their amounts in descending order
    const sortedItems = Object.entries(itemAmounts).sort((a, b) => b[1] - a[1]);

    // Take the top five items with the highest amounts
    const topItems = sortedItems.slice(0, 5);

    // Add topItems to data object
    data.topItems = topItems;

    res.render("admindash", {
      activeUsers: users.length,
      data: data,
      topItems:data.topItems,
      stipends: allStipends,
      stipend: {},
      entryError: req.flash("entryerror"),
      user: req.user,
    });
  } catch (err) {
    console.error(err);
    res.send("SOMETHING WENT WRONG");
  }
});


module.exports = router;
