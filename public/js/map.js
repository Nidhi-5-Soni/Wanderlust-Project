maptilersdk.config.apiKey = mapToken;

const defaultCenter = [77.2090, 28.6139]; // fallback

async function initMap() {
    let center = defaultCenter;

    // Use geometry if available
    if (listingGeometry?.coordinates?.length === 2) {
        center = listingGeometry.coordinates;
    } 
    // Otherwise, geocode the listing location
    else if (listingLocation) {
        try {
            const res = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(listingLocation)}.json?key=${mapToken}`
            );
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                center = data.features[0].geometry.coordinates;
            } else {
                console.warn("No coordinates found for location, using default.");
            }
        } catch (err) {
            console.error("Geocoding error:", err);
        }
    }

    // Initialize map
    const map = new maptilersdk.Map({
        container: "map",
        style: maptilersdk.MapStyle.STREETS,
        center: center,
        zoom: 9
    });

    // Add marker
    map.on("load", () => {
        new maptilersdk.Marker()
            .setLngLat(center)
            .addTo(map);
    });
}

// Run after DOM is ready
document.addEventListener("DOMContentLoaded", initMap);
