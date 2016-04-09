/**
 * Created by amir on 03/04/16.
 */

var place = function (name, reviews) {
    this.name = name;
    this.reviews = reviews;
};

place.prototype.setPlaceReviews = function (reviews) {
    this.reviews = reviews;
};