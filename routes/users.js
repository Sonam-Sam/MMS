const express = require("express");
const router = express.Router();
const passport = require("passport");
const crypto = require("crypto");
const async = require("async");
const nodemailer = require("nodemailer");
const multer = require("multer");
const util = require("util");
const bcrypt = require('bcrypt');
const fs = require("fs"); // Import the 'promises' version of the fs module

// Requiring user model
const User = require("../models/usermodel");

// Check is user is authenticated
function isAuthenticatedUser(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error_msg", "Please Login first to access this page.");
  res.redirect("/login");
}

// Middleware for super admin
function requireSuperAdmin(req, res, next) {
  if (req.user && req.user.role === 'super admin') {
    return next();
  } else {
    req.flash("error_msg", "You are unauthorized");
  }
}

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './assets/profiles')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      req.fileValidationError = "Only image files are allowed!";
      return cb(null, false);
    }
    cb(null, true);
  },
}).single('image');

// Get routes
router.get("/", (req, res) => {
  res.render("home");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

// Profile for user
router.get("/profile", async (req, res) => {
  try {
    const users = await User.find().exec();
    const buser = req.user; // assuming you are using passport for authentication
    res.render("profile", {
      title: "User Profile",
      users: users.filter(user => user._id.equals(buser._id)), // filter users by id
      buser: buser // pass the logged in user object to the EJS file
    });
  } catch (err) {
    req.flash("error_msg", "ERROR: " + err);
    res.redirect("/profile");
  }
});

// get route for profile for admin
router.get("/aprofile", async (req, res) => {
  try {
    const users = await User.find().exec();
    const auser = req.user; // assuming you are using passport for authentication
    res.render("aprofile", {
      title: "Admin Profile",
      users: users.filter(user => user._id.equals(auser._id)), // filter users by id
      auser: auser // pass the logged in user object to the EJS file
    });
  } catch (err) {
    req.flash("error_msg", "ERROR: " + err);
    res.redirect("/aprofile");
  }
});

// Edit admin profile and update with new data
router.post("/new/:id", upload, async (req, res) => {
  let id = req.params.id;
  let new_image = '';

  if (!req.file) {
    const user = await User.findById(id);
    if (user.image) { // if user previously had an image, keep it
      new_image = user.image;
    } else { // otherwise, set default image
      new_image = "/profiles/default_user.png"; // replace default_user.png with your default image filename
    }
  } else {
    new_image = req.file.filename;
    const user = await User.findById(id);
    if (user.image && user.image !== "/default_user.png") { // if user previously had an image (except for the default image), delete it
      try {
        await fs.promises.unlink("./assets/profiles/" + user.image);
      } catch (err) {
        console.log(err);
      }
    }
  }

  try {
    const result = await User.findByIdAndUpdate(id, {
      name: req.body.name,
      gender: req.body.gender,
      contact: req.body.contact,
      image: new_image,
    });
    req.flash("success_msg", "Profile updated successfully!");
    res.redirect("/aprofile");
  } catch (err) {
    req.flash("error_msg", "ERROR " + err);
    res.redirect("/edit_aprofile");
  }
});

// Edit users profile and update with new data
router.post("/old/:id", upload, async (req, res) => {
  let id = req.params.id;
  let new_image = '';

  if (!req.file) {
    const user = await User.findById(id);
    if (user.image) { // if user previously had an image, keep it
      new_image = user.image;
    } else { // otherwise, set default image
      new_image = "/profiles/default_user.png"; // replace default_user.png with your default image filename
    }
  } else {
    new_image = req.file.filename;
    const user = await User.findById(id);
    if (user.image && user.image !== "/default_user.png") { // if user previously had an image (except for the default image), delete it
      try {
        await fs.promises.unlink("./assets/profiles/" + user.image);
      } catch (err) {
        console.log(err);
      }
    }
  }

  try {
    const result = await User.findByIdAndUpdate(id, {
      name: req.body.name,
      gender: req.body.gender,
      contact: req.body.contact,
      image: new_image,
    });
    req.flash("success_msg", "Profile updated successfully!");
    res.redirect("/profile");
  } catch (err) {
    req.flash("error_msg", "ERROR " + err);
    res.redirect("/profile");
  }
});


// get route for users
router.get("/users", async (req, res) => {
  try {
    // Find all users except for super admins
    const users = await User.find({
      role: { $ne: "super admin" },
      status: "active"
    }).exec();
    const status = req.user.status;
    // Get the user's name from the req object
    const userName = req.user.name;

    res.render("users", {
      title: "Users Page",
      users: users,
      status: status,
      userName: userName
    });
  } catch (err) {
    req.flash("error_msg", "ERROR: " + err);
    res.redirect("signup");
  }
});

// To log out
router.get("/logout", function (req, res) {
  req.logOut(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success_msg", "You have been successfully logged out!");
    res.redirect("/");
  });
});

// Forgot password
router.get("/forgot", (req, res) => {
  res.render("forgot");
});

// Index
// router.get("/index", isAuthenticatedUser, async (req, res) => {
//   try {
//     // Find all users except for super admins
//     const users = await User.find({
//       status: "active"
//     }).exec();

//     res.render("index", {
//       title: "Admin Landing Page",
//       activeUsers: users.length
//     });
//   } catch (err) {
//     req.flash("error_msg", "ERROR: " + err);
//     res.redirect("login");
//   }
// });


router.get("/reset/:token", (req, res) => {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash(
          "error_msg",
          "Password reset token is invalid or has been expired!"
        );
        return res.redirect("/forgot");
      }

      return res.render("newpassword", { token: req.params.token });
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR: " + err);
      res.redirect("/forgot");
    });
});

// Change Password for User
router.get("/password/change", isAuthenticatedUser, (req, res) => {
  res.render("changepassword");
});

// Change Password for Admin
router.get("/achangepassword", isAuthenticatedUser, (req, res) => {
  res.render("achangepassword");
});

/////////////////////// POST ROUTES ///////////////////////

// Login post
router.post("/login", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.flash("error_msg", "Invalid email or password. Try Again!!!");
      return res.redirect("/login");
    }
    if (user.status !== "active") {
      req.flash("error_msg", "Seems like you are not a member of mess committee because your account is not yet activated.");
      return res.redirect("/login");
    }
    if (user.role === "super admin") {
      passport.authenticate("local", {
          successRedirect: "/admindash",
          failureRedirect: "/login",
          failureFlash: true,
        })(req, res, next);
    } else {
      passport.authenticate("local", {
        successRedirect: "/ubills",
        failureRedirect: "/login",
        failureFlash: true,
      })(req, res, next);
    }

  } catch (error) {
    req.flash("error_msg", "Error logging in user: " + error.message);
    res.redirect("/login");
  }
});


// POST route for user signup
router.post('/signup', async (req, res) => {
  try {
    let { name, email, role, gender, contact, password } = req.body;

    // Check if email is already registered
    const userExists = await User.findOne({ email });
    if (userExists) {
      req.flash("error_msg", "The user with this email is already registered.");
      return res.redirect("/signup");
    }

    let userData = {
      name,
      email,
      role,
      gender,
      contact,
      image: '/default_user.png'
    };

    const user = await User.register(userData, password);

    // Send email to admin with activation link
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
      secure: true
    });

    const activationLink = `${req.protocol}://${req.get('host')}/activate/${user._id}`;
    const mailOptions = {
      from: user.email,
      to: process.env.GMAIL_EMAIL,
      subject: 'New user registration',
      text: `A new user has registered with the email ${email}. Click the following link to activate their account: ${activationLink}\n\nBest regards,\n${name}`,
    };

    await transporter.sendMail(mailOptions);

    req.flash("success_msg", "Registration successful:\n An activation link has been sent to your email. Please check your inbox and follow the instructions to activate your account.");
    res.redirect("/login");

  } catch (err) {
    req.flash('error_msg', `ERROR: ${err.message}`);
    res.redirect('/signup');
  }
});

// Activation route
router.get("/activate/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.status !== "pending") {
      throw new Error("User is already activated");
    }

    user.status = "active";
    await user.save();

    // Send email to user with activation confirmation
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
      secure: true
    });

    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: user.email,
      subject: 'Account activation',
      text: `Dear ${user.name},\n\nYour account has been successfully activated. You can now login to your account.\n\nBest regards,\nThe Admin`,
    };

    await transporter.sendMail(mailOptions);

    req.flash("success_msg", "Account activated successfully. You can now login.");
    res.redirect("/login");
  } catch (error) {
    req.flash("error_msg", "Error activating account: " + error.message);
    res.redirect("/signup");
  }
});

// To log out
router.get("/logout", isAuthenticatedUser, function (req, res) {
  req.logOut(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success_msg", "You have been successfully logged out!");
    res.redirect("/login");
  });
});

// Delete users from the database
router.get("/delete_user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await User.findByIdAndRemove(id).exec();

    if (result && result.image) {
      await fs.promises.unlink(`./assets/profiles/${result.image}`);
    }

    req.flash("success_msg", "User deleted successfully!");
    res.redirect("/users");
  } catch (err) {
    req.flash("error_msg", `Error deleting user: ${err}`);
    res.redirect("/users");
  }
});

// Define the route handler for the POST request
router.post('/delete_user/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      req.flash("error_msg", "User not found!");
      return res.redirect("/users");
    } else {
      if (deletedUser.image && deletedUser.image !== "/default_user.png") { // if user previously had an image (except for the default image), delete it
        try {
          await fs.promises.unlink("./assets/profiles/" + deletedUser.image);
        } catch (err) {
          console.log(err);
        }
      }

      req.flash("success_msg", "User deleted successfully!");
      res.redirect("/users");
    }
  } catch (err) {
    req.flash("error_msg", `Error deleting user: ${err}`);
    res.redirect("/users");
  }
});


// POST request for change password for USER
router.post("/password/change", (req, res) => {
  if (req.body.password !== req.body.confirmpassword) {
    req.flash("error_msg", "Password do not match. Try again!");
    return res.redirect("/password/change");
  }

  User.findOne({ email: req.user.email }).then((user) => {
    user.authenticate(req.body.oldpassword, (err, matched) => {
      if (err) {
        req.flash("error_msg", "ERROR: " + err);
        return res.redirect("/password/change");
      }
      if (!matched) {
        req.flash("error_msg", "Old password is incorrect. Try again!");
        return res.redirect("/password/change");
      }

      user.setPassword(req.body.password, (err) => {
        user
          .save()
          .then((user) => {
            req.flash("success_msg", "Password changed successfully!");
            res.redirect("/");
          })
          .catch((err) => {
            req.flash("error_msg", "ERROR: " + err);
            res.redirect("/password/change");
          });
      });
    });
  });
});

// POST request for change password for ADMIN
router.post("/achangepassword", (req, res) => {
  if (req.body.password !== req.body.confirmpassword) {
    req.flash("error_msg", "Password do not match. Try again!");
    return res.redirect("/achangepassword");
  }

  User.findOne({ email: req.user.email }).then((user) => {
    user.authenticate(req.body.oldpassword, (err, matched) => {
      if (err) {
        req.flash("error_msg", "ERROR: " + err);
        return res.redirect("/achangepassword");
      }
      if (!matched) {
        req.flash("error_msg", "Old password is incorrect. Try again!");
        return res.redirect("/achangepassword");
      }

      user.setPassword(req.body.password, (err) => {
        user
          .save()
          .then((user) => {
            req.flash("success_msg", "Password changed successfully!");
            res.redirect("/");
          })
          .catch((err) => {
            req.flash("error_msg", "ERROR: " + err);
            res.redirect("/achangepassword");
          });
      });
    });
  });
});

// Routes to handle forgot password
router.post("/forgot", async (req, res, next) => {
  try {
    const token = await new Promise((resolve, reject) => {
      crypto.randomBytes(20, (err, buf) => {
        if (err) reject(err);
        resolve(buf.toString("hex"));
      });
    });

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.flash("error_msg", "User does not exist with this email.");
      return res.redirect("/forgot");
    }
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1800000; // 1/2 hours
    await user.save();

    const smtpTransport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      to: user.email,
      from: "sonamsam24@gmail.com",
      subject: "Password Recovery Email",
      text:
        "Please click the following link to recover your password: \n\n" +
        "http://" +
        req.headers.host +
        "/reset/" +
        token +
        "\n\n" +
        "If you did not request this, please ignore this email.",
    };

    await smtpTransport.sendMail(mailOptions);

    req.flash(
      "success_msg",
      "Email send with further instructions. Please check that."
    );
    return res.redirect("/forgot");
  } catch (err) {
    req.flash("error_msg", "ERROR: " + err);
    res.redirect("/forgot");
  }
});

// Password changed successfully for forgot password
const { promisify } = require("util");
const { title } = require("process");

router.post("/reset/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash(
        "error_msg",
        "Password reset token is invalid or has been expired!"
      );
      return res.redirect("/forgot");
    }

    if (req.body.password !== req.body.confirmpassword) {
      req.flash("error_msg", "Password don't match");
      return res.redirect("/forgot");
    }

    const setPasswordPromise = promisify(user.setPassword).bind(user);
    await setPasswordPromise(req.body.password);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    const logInPromise = promisify(req.logIn).bind(req);
    await logInPromise(user);

    const smtpTransport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.GMAIL_EMAIL,
      subject: "Your password is changed",
      text: `Hello, ${user.name}\n\nThis is the confirmation that the password for your account ${user.email} has changed.`,
    };

    const sendMailPromise = promisify(smtpTransport.sendMail).bind(
      smtpTransport
    );
    await sendMailPromise(mailOptions);

    req.flash("success_msg", "Your password has been changed successfully.");
    res.redirect("/login");
  } catch (err) {
    req.flash("error_msg", `ERROR: ${err}`);
    res.redirect("/forgot");
  }
});

module.exports = router;
