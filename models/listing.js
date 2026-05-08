const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js")

const ListingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: {
        filename: {
            type: String,
            default: "listingimage"
        },
        url: {
            type: String,
            default: "https://images.unsplash.com/photo-1664161872753-03f2c9660d33?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            set: (v) => v === "" ? "https://images.unsplash.com/photo-1664161872753-03f2c9660d33?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" : v,
        }
    },
    price: Number,
    location: String,
    country: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",

    }
});

// AFTER DELETING LISTING REVIEWS SHOULD ALSO DELETE
// POST MONGOOSE MIDDLEWARE 
ListingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }

})

const Listing = mongoose.model("Listing", ListingSchema);
module.exports = Listing;