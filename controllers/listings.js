const Listing = require("../models/listing");
const geocoder = require("../utils/geocoder");

// module.exports.index = async (req, res) => {
//     const allListings = await Listing.find({});
//     res.render("listings/index.ejs", { allListings });
// };

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;

    const { title, description, price, location, country,category } = req.body.listing;
    let coordinates = [0, 0]; // default instead of null

    let geoData;
    try {
        geoData = await geocoder.geocode(location);
        if (geoData && geoData.length > 0) {
            coordinates = [geoData[0].longitude, geoData[0].latitude];
        }
    } catch (err) {
        console.error("Node-Geocoder error:", err);
    }
    console.log("GeoData:", geoData);
    console.log("Final Coordinates:", coordinates);
        const newListing = new Listing({
        title,
        description,
        price,
        location,
        country,
        category,
        owner: req.user._id,
        image: { url, filename },
        geometry: coordinates ? { type: "Point", coordinates } : undefined,
    });

    await newListing.save();
    req.flash("success", "New listing created");
    res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, location, country,category } = req.body.listing;

    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    listing.title = title;
    listing.description = description;
    listing.price = price;
    listing.location = location;
    listing.country = country;
    listing.category = category; 

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    }

    await listing.save();
    req.flash("success", "Listing updated");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
};
//filters
// module.exports.index = async (req, res) => {
//     const { category } = req.query;
//     let filter = {};
//     if (category) {
//         filter.category = new RegExp(`^${category}$`, "i"); // case-insensitive match
//     }

//     const allListings = await Listing.find(filter);
//     res.render("listings/index", { allListings, category });
// };
module.exports.index = async (req, res) => {
    const { category, search } = req.query;

    let filter = {};

    // category filter
    if (category) {
        filter.category = new RegExp(`^${category}$`, "i");
    }

    // search filter (title, location, country)
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { country: { $regex: search, $options: "i" } }
        ];
    }

    const allListings = await Listing.find(filter);
    res.render("listings/index", { allListings, category, search });
};
