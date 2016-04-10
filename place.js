/**
 * Created by amir on 03/04/16.
 */
var jQuery = require('jquery-deferred');
request = require('request'),
    cheerio = require('cheerio'),
    Review = require('./review.js'),
    http = require('http');


var Place = function (dom) {
    this.reviews = [];
    if (!!dom) {
        this.dom = dom;
        this.init();
    }
};

Place.prototype.init = function () {
    var $ = cheerio.load(this.dom);
    this.street = $($('.street-address')[0]).text();
    this.locality = $($('.locality')[0]).text();
    this.country = $($('.country-name')[0]).text();
    this.description = $($('.additional_info').find('.content')[1]).text();
    this.name = $($('.heading_name')[0]).text();
};

Place.prototype.fetchReviews = function () {
    var oDeferred = jQuery.Deferred();
    var $ = cheerio.load(this.dom);
    var $quotes = $('.quote');
    var numCalls = $quotes.length;
    var numResponses = 0;
    $quotes.each(function (_, entry) {
        var url2 = $(entry).find('a');
        if (typeof(url2) !== 'undefined' && typeof($(url2).attr('href') !== 'undefined'))
            url2 = $(url2).attr('href');
        request("https://www.tripadvisor.com/" + url2, function (error, response, body) {
            numResponses++;
            if (!error && response.statusCode == 200) {
                this.handleReviewResponse(error, response, body);
            }
            if (numResponses === numCalls) {
                delete this.dom;
                oDeferred.resolve(this);
            }
        }.bind(this));
    }.bind(this));
    return oDeferred.promise();
};

Place.prototype.handleReviewResponse = function (error, response, body) {
    var review = new Review(body);
    this.reviews.push(review);
};

Place.Query = function (query) {
    var placesArr = [];
    var done = false;
    var oDeferred = jQuery.Deferred();
    request(query, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            var $places = $('.result');
            var numRequests = $places.length;
            var numResponses = 0;
            var numResponsesOfReviews = 0;
            $places.each(function (_, place) {
                var onClickText = $(place).attr("onclick");
                var link = onClickText.match(/.*((Restaurant|Attraction).*\.html).*/);
                if (link.length > 1) {
                    request('https://www.tripadvisor.com/' + link[1], function (error, response, body) {
                        numResponses++;
                        if (!error && response.statusCode == 200) {
                            var place = new Place(body);
                            place.fetchReviews().done(function (place) {
                                numResponsesOfReviews++;
                                placesArr.push(place);
                                if (done && numResponsesOfReviews == numResponses)
                                    oDeferred.resolve(placesArr);
                            })
                        }
                        if (numResponses == numRequests) {
                            done = true;
                        }

                    });
                } else {
                    numRequests--;
                }
            });
        }
    });
    return oDeferred.promise();


};

module.exports = Place;