if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}



const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
// const user = require('./models/user.js');
const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");




const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log("connected to db");
})
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600
});

store.on("error", ()=>{
    console.log("ERROR IN MONGO SESSION STORE", err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000, // in ms. expiration time = 1 week 
        maxAge: 7*24*60*60*1000,
        httpOnly: true // for cross scripting attacks 
    }
}

// app.get("/", (req, res) => {
//     res.send("Hii, I am root.");
// })

// MIDDLEWARES
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session()); // series of req and res each associated with same user is a session
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser()); // to store user's info
passport.deserializeUser(User.deserializeUser()); //to destore

app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
}) // middleware 

// app.get("/demouser", async (req, res) =>{
//     let fakeUser = new User({
//         email: "student.gmail.com",
//         username: "nit-student"
//     });

//     let registeredUser = await User.register(fakeUser, "helloworld"); // automatically checks if username is unique or not
//     res.send(registeredUser);
// })


app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);








// app.get("/testListing", async (req,res) =>{
//     let sampleListing = new Listing({
//         title: "My new villa",
//         description: "by the beach",
//         price: 12000,
//         location: "goa",
//         country: "india",
//     })

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successfull testing");
// })

app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page not Found!"));
});




app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs", { message });
})



// app.listen(8080, () => {
//     console.log("server is listening to port 8080");
// });

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`server is listening to port ${port}`);
});