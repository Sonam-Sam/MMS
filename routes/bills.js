const express = require("express");
const router = express.Router();
const passport = require("passport");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const multer = require("multer");
const util = require("util");
const path = require('path');
const fs = require("fs"); // Import the 'promises' version of the fs module

// Requiring bill model
const combine = require("../models/billsmodel");
const Bill = combine.Bill;
const Report = combine.Report;

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

// BILLS Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./bills");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

// const upload = multer({ storage: storage }).single('image'); for Bills
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      req.fileValidationError = "Only image files are allowed!";
      return cb(null, false);
    }
    cb(null, true);
  },
}).single("image");

// Inserting bills in the database
router.post("/add_bills", isAuthenticatedUser && requireSuperAdmin, async (req, res) => {
  upload(req, res, async function (err) {
    if (req.fileValidationError) {
      req.flash("error_msg", req.fileValidationError);
      return res.redirect("/add_bills");
    }

    // Check if image is present in the request object
    if (!req.file) {
      req.flash("error_msg", "ERROR: Image is required.");
      return res.redirect("/add_bills");
    }

    const bill = new Bill({
      title: req.body.title,
      description: req.body.description,
      year: req.body.year,
      month: req.body.month,
      image: req.file.filename,
    });

    try {
      await bill.save();
      req.flash("success_msg", "Bill added successfully!");
      res.redirect("/bills");
    } catch (err) {
      req.flash("error_msg", "ERROR: " + err);
      res.redirect("/add_bills");
    }
  });
});

// Update bills route when changing or editing its value
router.post("/update/:id", upload, async (req, res) => {
  let id = req.params.id;
  let new_image = '';

  if (req.file) {
    new_image = req.file.filename;
    try {
      await fs.promises.unlink("./bills/" + req.body.old_image);
    } catch (err) {
      console.log(err);
    }
  } else {
    new_image = req.body.old_image;
  }

  try {
    const result = await Bill.findByIdAndUpdate(id, {
      description: req.body.description,
      year: req.body.year,
      month: req.body.month,
      image: new_image,
      title: req.body.title,
    });
    req.flash("success_msg", "Bills updated successfully!");
    res.redirect("/bills");
  } catch (err) {
    req.flash("error_msg", "ERROR " + err);
    res.redirect("/edit_bills");
  }

});

// Define the route handler for the POST request
router.post('/bills/delete/:id', isAuthenticatedUser, async (req, res) => {
  try {

    const deletedBill = await Bill.findByIdAndDelete(req.params.id);
    if (!deletedBill) {
      req.flash("error_msg", "Bill not found!");
      return res.redirect("/bills");
    }

    if (deletedBill && deletedBill.image !== "") {
      await fs.promises.unlink(`./bills/${deletedBill.image}`);
    }
    req.flash("success_msg", "Bill deleted successfully!");
    res.redirect("/bills");

  } catch (err) {
    req.flash("error_msg", `Error deleting bill: ${err}`);
    res.redirect("/bills");
  }
});

// Delete bills from the table
router.get("/delete/:id", isAuthenticatedUser, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Bill.findByIdAndRemove(id).exec();

    if (result && result.image !== "") {
      await fs.promises.unlink(`./bills/${result.image}`);
    }

    req.flash("success_msg", "Bill deleted successfully!");
    res.redirect("/bills");
  } catch (err) {
    req.flash("error_msg", `Error deleting bill: ${err}`);
    res.redirect("/bills");
  }
});


// Edit bills route
router.get("/edit/:id", isAuthenticatedUser && requireSuperAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const bill = await Bill.findById(id);
    if (!bill) {
      res.redirect("/bills");
    } else {
      res.render("edit_bills", {
        title: "Edit Bill",
        bill: bill,
      });
    }
  } catch (err) {
    console.log(err);
    res.redirect("/bills");
  }
});

// Bills route
router.get('/bills', isAuthenticatedUser, async (req, res) => {
  try {
    const bills = (await Bill.find()).reverse();
    const userRole = req.user.role;
    res.render("bills", {
      title: "Bills Page",
      bills: bills,
      userRole: userRole
    });
  } catch (err) {
    req.flash("error_msg", "ERROR: " + err);
    res.redirect("/index");
  }
})

// REPORTS Storage
const rstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./reports");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

const rupload = multer({
  storage: rstorage,
}).single("file");

// Inserting bills in the database
router.post("/add_reports", isAuthenticatedUser, async (req, res) => {
  rupload(req, res, async function (err) {
    if (req.fileValidationError) {
      req.flash("error_msg", req.fileValidationError);
      return res.redirect("/add_reports");
    }

    // Check if file is present in the request object
    if (!req.file) {
      req.flash("error_msg", "ERROR: File is required.");
      return res.redirect("/add_reports");
    }

    const report = new Report({
      title: req.body.title,
      year: req.body.year,
      month: req.body.month,
      file: {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
      },
    });

    try {
      await report.save();
      req.flash("success_msg", "Report added successfully!");
      res.redirect("/reports");
    } catch (err) {
      req.flash("error_msg", "ERROR: " + err);
      res.redirect("/add_reports");
    }
  });
});

// Reports get route
router.get('/reports', isAuthenticatedUser, async (req, res) => {
  try {
    const reports = (await Report.find()).reverse();
    res.render("reports", {
      title: "Reports Page",
      reports: reports
    });
  } catch (err) {
    req.flash("error_msg", "ERROR: " + err);
    res.redirect("/index");
  }
})

// Reports Query Starts for admin
async function searchReport(year, month) {
  let query = {};
  if (year && month) {
    query = {
      year: year,
      month: month
    };
  } else if (year) {
    query = {
      year: year
    };
  } else if (month) {
    query = {
      month: month
    };
  }

  const reports = await Report.find(query);
  return reports;
}
// Query Ends

// To search for the bills on the user's side
router.post("/reports/search", isAuthenticatedUser, async (req, res) => {
  const month = req.body.month;
  const year = req.body.year;

  const reports = await searchReport(year, month);
  
  res.render("reports", { 
    reports: reports 
  });
});
// Search reports for admin ends

// Post route to delete the reports from admin dashboard
router.post('/reports/delete/:id', isAuthenticatedUser, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      req.flash("error_msg", "Report not found!");
      return res.redirect("/reports");
    }

    if (report.file && report.file.data) {
      const fileName = report._id.toString();
      const filePath = path.join(__dirname, "../reports", fileName);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }

    req.flash("success_msg", "Report deleted successfully!");
    res.redirect("/reports");

  } catch (err) {
    req.flash("error_msg", `Error deleting report: ${err}`);
    res.redirect("/reports");
  }
});

// Reports for USER
router.get("/ureports", isAuthenticatedUser, async (req, res) => {
  try {
    const reports = (await Report.find()).reverse();
    res.render("ureports", {
      title: "Reports Page",
      reports: reports
    });
  } catch (err) {
    req.flash("error_msg", "ERROR: " + err);
    res.redirect("/index");
  }
});

// Reports Query Starts
async function searchReports(year, month) {
  let query = {};
  if (year && month) {
    query = {
      year: year,
      month: month
    };
  } else if (year) {
    query = {
      year: year
    };
  } else if (month) {
    query = {
      month: month
    };
  }

  const reports = await Report.find(query);
  return reports;
}
// Query Ends

// To search for the bills on the user's side
router.post("/ureports/search", isAuthenticatedUser, async (req, res) => {
  const month = req.body.month;
  const year = req.body.year;

  const reports = await searchReports(year, month);
  
  res.render("ureports", { 
    reports: reports 
  });
});

// Bills display in User Side
router.get("/ubills", isAuthenticatedUser, async (req, res) => {
  try {
    const bills = (await Bill.find()).reverse();
    res.render("ubills", {
      title: "Bills Page",
      bills: bills,
    });
  } catch (err) {
    req.flash("error_msg", "ERROR: " + err);
    res.redirect("/ubills");
  }
});

// Query Starts
async function searchBills(year, month) {
  let query = {};
  if (year && month) {
    query = {
      year: year,
      month: month
    };
  } else if (year) {
    query = {
      year: year
    };
  } else if (month) {
    query = {
      month: month
    };
  }

  const bills = await Bill.find(query);
  return bills;
}
// Query Ends

// To search for the bills on the user's side
router.post("/ubills/search", isAuthenticatedUser, async (req, res) => {
  const month = req.body.month;
  const year = req.body.year;

  const bills = await searchBills(year, month);
  
  res.render("ubills", { 
    bills: bills 
  });
});

// router.get('/add_bills', isAuthenticatedUser, (req, res) => {
router.get("/add_bills", isAuthenticatedUser, async (req, res) => {
  res.render("add_bills");
});

router.get("/add_reports", isAuthenticatedUser, async (req, res) => {
  res.render("add_reports");
});


module.exports = router;
