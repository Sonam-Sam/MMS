const express = require("express");
const router = express.Router();
const flash = require("connect-flash")

const Detail = require("../models/detailsmodel");
const Stipend = require("../models/stipendmodel");

router.use(flash());

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
    throw new Error("No data found in the database.");
  }

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


// edit router
router.get("/details/:id/edit", async function (req, res) {
  try {
    const details = await Detail.findById(req.params.id);
    res.render("edit", {
      details: details,
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/details/:id", async function (req, res) {
  try {
    const detail = await Detail.findById(req.params.id);
    const oldAmount = detail.amount;

    const data = await getReportData();
    const currentDate = new Date();
    smonth = currentDate.getMonth() + 1;
    syear = currentDate.getFullYear();

    detail.memo = req.body.memo;
    detail.vendor = req.body.vendor;
    detail.item = req.body.item;
    detail.quantity = req.body.quantity;
    detail.rate = req.body.rate;
    detail.amount = detail.quantity * detail.rate;
    detail.unit = req.body.unit;
    detail.jrlno = req.body.jrlno;

    // update the balance and useAmount for the details
    const details = await Detail.find({
      purchasedate: {
        $gte: new Date(
          detail.purchasedate.getFullYear(),
          detail.purchasedate.getMonth(),
          1
        ),
        $lte: new Date(
          detail.purchasedate.getFullYear(),
          detail.purchasedate.getMonth() + 1,
          0
        ),
      },
    }).sort({ purchasedate: -1 });

    let totalAmount = detail.balance + detail.amount;
    let totalUseAmount = 0;
    for (let j = 0; j < details.length; j++) {
      if (details[j]._id.equals(detail._id)) {
        continue;
      }
      totalAmount -= details[j].amount;
      details[j].balance = totalAmount;

      // Calculate the new useamount based on the previous document
      details[j].useamount = totalUseAmount + details[j].amount;
      totalUseAmount = details[j].useamount;

      await details[j].save();
    }

    // Calculate the new useamount and balance for the edited document
    detail.balance = totalAmount - detail.amount;
    detail.useamount = totalUseAmount + detail.amount;

    await detail.save();
    res.redirect("/details");
    const allDetails = await Detail.find({}).sort({ purchasedate: -1 }); // sort all details by purchasedate in descending order
    res.render("details", {
      details: details,
      smonth: smonth,
      syear:syear,
      detail: detail,
      stipendError: req.flash("stipenderror"),
      detailadd: req.flash("detailadd"),
      closingerror: req.flash("closingerror"),
      detailclose: req.flash("detailclose"),
      data,
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/details/:id/delete", async function (req, res) {
  try {
    const data = await getReportData();
    const detail = req.params.id ? await Detail.findById(req.params.id) : { purchasedate: '', vendor: '', category: '', item: '', unit: '', price: '', quantity: '', total: '', balance: '', useamount: '' };
    // update the balance and useAmount for the details
    const details = await Detail.find({
      purchasedate: {
        $gte: new Date(
          detail.purchasedate.getFullYear(),
          detail.purchasedate.getMonth(),
          1
        ),
        $lte: new Date(
          detail.purchasedate.getFullYear(),
          detail.purchasedate.getMonth() + 1,
          0
        ),
      },
    }).sort({ purchasedate: -1 });

    let totalAmount = detail.balance;
    for (let j = 0; j < details.length; j++) {
      if (details[j]._id.equals(detail._id)) {
        continue;
      }
      totalAmount -= details[j].amount;
      details[j].balance = totalAmount;
      await details[j].save();
    }

    let useAmount = 0;
    for (let j = 0; j < details.length; j++) {
      useAmount += details[j].amount;
      details[j].useamount = useAmount;
      await details[j].save();
    }

    await Detail.findByIdAndDelete(req.params.id);
    const smonth = req.query.smonth;
    const syear =  req.query.syear;
    res.redirect("/details")

    const allDetails = await Detail.find({}).sort({ purchasedate: -1 }); // sort all details by purchasedate in descending order
    res.render("details", {
      details: allDetails,
      smonth: smonth,
      syear: syear,
      detail: detail,
      data,
      stipendError: req.flash("stipenderror"),
      detailadd: req.flash("detailadd"),
      closingerror: req.flash("closingerror"),
      detailclose: req.flash("detailclose"),

    });
  } catch (err) {
    console.log(err);
  }
});



// Edit existing stipend
router.post("/stipends/:id", async function (req, res) {
  try {
    const stipend = await Stipend.findById(req.params.id);

    if (!stipend) {
      res.status(404).send("Stipend not found");
      return;
    }

    stipend.date = req.body.date;
    stipend.students = req.body.students;
    stipend.stipend = req.body.stipend;
    stipend.cutstipend = req.body.cutstipend;
    stipend.total = req.body.students * req.body.stipend;
    stipend.stipendin = req.body.students * req.body.cutstipend;

    const date = new Date(req.body.date);
    const month = date.getMonth() + 1; // Month is zero-indexed, so add 1 to get the actual month
    const year = date.getFullYear();

    // const existingStipend = await Stipend.findOne({ month: month, year: year, _id: { $ne: req.params.id } });
    // if (existingStipend) {
    //   // If an entry already exists for this month and year, return an error message
    //   req.flash("entryerror", "Stipend entry for this month is already exist.Please reconfirm the month and make entry");
    //   res.redirect("/");
    //   return;
    // }

    await stipend.save();
    res.redirect("/")
    const allStipends = await Stipend.find({}).sort({ id: -1 }).limit(12);

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

    // Render the admin dashboard view with the updated stipends and topItems data
    res.render("admindash", {
      stipends: allStipends,
      topItems: topItems,
      data: await getReportData(),
      entryError: req.flash("entryerror"),
      detailclose: req.flash("detailclose"),


      month: month,
      year: year,
    });
  } catch (err) {
    console.log(err);
  }
});


router.post('/close-details', async (req, res) => {
  const { month, year } = req.body;
  const datepickerValue = req.body.datepicker;
  const data = await getReportData();
  const user = req.session.user;
  const detail = req.params.id ? await Detail.findById(req.params.id) : { purchasedate: '', vendor: '', category: '', item: '', unit: '', price: '', quantity: '', total: '', balance: '', useamount: '' };


  // Parse the datepicker value into a Date object
  const selectedDate = new Date(datepickerValue);

  // Extract the month and year values from the Date object
  const smonth = selectedDate.getMonth() + 1; // add 1 because getMonth() returns a zero-based index
  const syear = selectedDate.getFullYear();

  // Get all details for the specified month and year
  const details = await Detail.find({
    purchasedate: {
      $gte: new Date(year, month - 1, 1),
      $lte: new Date(year, month, 0)
    }
  });

  if (details.length === 0) {
    req.flash("closingerror", `There is no details on the month ${month} and year ${year}. Please re-confirm your closing statement.`);
    res.redirect("/details");
    return;
  }

  // Update the details to disable editing
  await Promise.all(details.map(async detail => {
    detail.editable = false;
    await detail.save();
  }));

  req.flash("detailclose", `Detail has been successfully close for the month ${month} and year ${year}.`);
  res.render('details', {
    details: details,
    smonth: smonth,
    syear: syear,
    detail: detail,
    stipendError: req.flash("stipenderror"),
    detailadd: req.flash("detailadd"),
    closingerror: req.flash("closingerror"),
    detailclose: req.flash("detailclose"),
    user: user,
    data,
  });
});






module.exports = router
