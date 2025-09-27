const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { db } = require("./config.json");

const User = require("./models/User");

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");

const app = express();

mongoose.connect(db)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "change_this_secret",
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: "No user with that email" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return done(null, false, { message: "Invalid password" });
    return done(null, user);
  } catch (e) { return done(e); }
}));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); }
  catch (e) { done(e); }
});
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (_req, res) => res.render("index"));
app.use("/", authRoutes);           
app.use("/properties", propertyRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
