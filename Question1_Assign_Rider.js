// Question 1: Smart and Stale Rider Assignment

const EARTH_RADIUS_IN_KILOMETERS = 6371;
const MAXIMUM_LOCATION_AGE_IN_MINUTES = 2;
const NORMAL_SEARCH_RADIUS_IN_KILOMETERS = 5;
const EXTENDED_SEARCH_RADIUS_IN_KILOMETERS = 10;
const DISTANCE_TIE_RANGE_IN_KILOMETERS = 0.5;


// Convert degrees to radians because the Haversine formula
// uses angles in radians.
function convertDegreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}


// Calculate the distance between two latitude/longitude points
// using the Haversine formula.
function calculateDistanceUsingHaversine(
    firstLatitude,
    firstLongitude,
    secondLatitude,
    secondLongitude
) {
    const latitudeDifference = convertDegreesToRadians(
        secondLatitude - firstLatitude
    );

    const longitudeDifference = convertDegreesToRadians(
        secondLongitude - firstLongitude
    );

    const firstLatitudeInRadians =
        convertDegreesToRadians(firstLatitude);

    const secondLatitudeInRadians =
        convertDegreesToRadians(secondLatitude);

    const calculation =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(firstLatitudeInRadians) *
        Math.cos(secondLatitudeInRadians) *
        Math.sin(longitudeDifference / 2) ** 2;

    const distance =
        2 *
        EARTH_RADIUS_IN_KILOMETERS *
        Math.asin(Math.sqrt(calculation));

    return distance;
}


// Rider location must not be older than 2 minutes.
// Old location data could cause the system to assign
// a rider who is no longer near the restaurant.
function isRiderLocationFresh(rider, currentTime) {
    const riderLocationUpdatedTime =
        new Date(rider.locationUpdatedAt);

    const locationAgeInMilliseconds =
        currentTime - riderLocationUpdatedTime;

    const maximumLocationAgeInMilliseconds =
        MAXIMUM_LOCATION_AGE_IN_MINUTES * 60 * 1000;

    return (
        locationAgeInMilliseconds >= 0 &&
        locationAgeInMilliseconds <=
            maximumLocationAgeInMilliseconds
    );
}


function findBestRiderWithinRadius(
    order,
    riders,
    searchRadiusInKilometers,
    currentTime
) {
    /*
    First remove riders with stale location data,
    then calculate the distance from each rider
    to the restaurant.
    */
    const availableRiders = riders
        .filter((rider) =>
            isRiderLocationFresh(rider, currentTime)
        )
        .map((rider) => {
            const distanceFromRestaurant =
                calculateDistanceUsingHaversine(
                    rider.latitude,
                    rider.longitude,
                    order.restaurantLatitude,
                    order.restaurantLongitude
                );

            return {
                ...rider,
                distanceFromRestaurant
            };
        })



        // Keep only riders inside the current search radius.
        .filter(
            (rider) =>
                rider.distanceFromRestaurant <=
                searchRadiusInKilometers
        )



        // Sort by distance so the nearest rider is first.
        .sort(
            (firstRider, secondRider) =>
                firstRider.distanceFromRestaurant -
                secondRider.distanceFromRestaurant
        );

    if (availableRiders.length === 0) {
        return null;
    }

    const nearestDistance =
        availableRiders[0].distanceFromRestaurant;


    /*
    If riders are within 500 meters of the nearest rider,
    treat the distance as close enough to use Rating
    as the tie-breaker.
    */
    const ridersWithinTieRange =
        availableRiders.filter(
            (rider) =>
                rider.distanceFromRestaurant -
                    nearestDistance <=
                DISTANCE_TIE_RANGE_IN_KILOMETERS
        );

    ridersWithinTieRange.sort(
        (firstRider, secondRider) => {


            // Higher Rating wins when the distance is close.
            if (
                firstRider.rating !==
                secondRider.rating
            ) {
                return (
                    secondRider.rating -
                    firstRider.rating
                );
            }


            // If Rating is also equal, choose the nearer rider.
            return (
                firstRider.distanceFromRestaurant -
                secondRider.distanceFromRestaurant
            );
        }
    );

    return ridersWithinTieRange[0];
}


function assignRider(order, riders) {
    const currentTime = new Date();


    // Start with the normal service radius of 5 kilometers.
    let selectedRider =
        findBestRiderWithinRadius(
            order,
            riders,
            NORMAL_SEARCH_RADIUS_IN_KILOMETERS,
            currentTime
        );

    if (selectedRider) {
        return {
            status: "assigned",
            rider: selectedRider,
            searchRadiusInKilometers:
                NORMAL_SEARCH_RADIUS_IN_KILOMETERS
        };
    }


    /*
    Fallback:
    If nobody is available within 5 kilometers,
    expand the search to 10 kilometers.

    In a real system, this value should be configurable
    based on business rules and service area.
    */
    selectedRider =
        findBestRiderWithinRadius(
            order,
            riders,
            EXTENDED_SEARCH_RADIUS_IN_KILOMETERS,
            currentTime
        );

    if (selectedRider) {
        return {
            status: "assigned",
            rider: selectedRider,
            searchRadiusInKilometers:
                EXTENDED_SEARCH_RADIUS_IN_KILOMETERS
        };
    }

    
    /*
    If no suitable rider is found, keep the order waiting
    instead of using stale location data or assigning
    a rider who is too far away.
    */
    return {
        status: "waiting_for_rider",
        rider: null,
        message:
            "No suitable rider is currently available. The system will try again with updated rider locations."
    };
}


module.exports = {
    assignRider,
    calculateDistanceUsingHaversine
};