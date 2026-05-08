const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");



//INDEX ROUTE
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("./listings/index.ejs", { allListings });
}))

//NEW ROUTE
router.get("/new", isLoggedIn, (req, res) => {
    res.render("./listings/new.ejs");
})

//SHOW ROUTE 
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    // id = id.trim();
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }
    res.render("./listings/show.ejs", { listing })
}))

//CREATE ROUTE
router.post("/", validateListing, isLoggedIn, wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    // Manually fix the image format before saving
    newListing.image = { url: req.body.listing.image, filename: "listingimage" };
    // to automatically add username to new listing created
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New Listing Created");
    res.redirect("/listings");
}))



//EDIT ROUTE
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    id = id.trim();
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    res.render("./listings/edit.ejs", { listing })
}));

//UPDATE ROUTE

router.put("/:id", isLoggedIn, isOwner, validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (typeof req.body.listing.image !== "undefined") {
        let url = req.body.listing.image;
        let filename = "listingimage";
        listing.image = { url, filename };
        await listing.save();
    }
    req.flash("success", "Listing Updated");


    res.redirect(`/listings/${id}`);
}));

//DELETE ROUTE
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
}));

module.exports = router;

