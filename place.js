/**
 * Created by amir on 03/04/16.
 */
var jQuery = require('jquery-deferred');
request = require('request'),
    cheerio = require('cheerio'),
    Review = require('./review.js'),
    http = require('http');
    Q = require('q');


var Place = function (dom) {
    this.reviews = [];
    if (!!dom) {
        this.dom = dom;
        this.init();
    }
};

Place.prototype.init = function () {
    var $ = cheerio.load(this.dom);
    this.street = $($('.street-address')[0]).text().replace(/(\r\n|\n|\r)/gm,"");;
    this.locality = $($('.locality')[0]).text().replace(/(\r\n|\n|\r)/gm,"");;
    this.country = $($('.country-name')[0]).text().replace(/(\r\n|\n|\r)/gm,"");;
    this.description = $($('.additional_info').find('.content')[1]).text().replace(/(\r\n|\n|\r)/gm,"");;
    this.name = $($('.heading_name')[0]).text().replace(/(\r\n|\n|\r)/gm,"");;
    console.log("Places created: " + this.name);
};

Place.prototype.fetchReviews = function () {
    var oDeferred = jQuery.Deferred();
    var answers = 0;
    var $ = cheerio.load(this.dom);
    var links = [];
    $('.pageNumbers').children("a").each ( function() {
        var link = this.attribs.href;
        links.push(link);
    });
    this.fetchReviewPage(this.dom).done( function() {
        if (links.length > 0) {
            this.getAllPageReviews(0, links.length, links).done(function () {
                oDeferred.resolve(this);
            }.bind(this));
        } else {
            oDeferred.resolve(this);
        }
    }.bind(this));

    return oDeferred.promise();
};

Place.prototype.getAllPageReviews = function (currentPage, pageNumbers, $pagesLinks) {
    var oDeferred = jQuery.Deferred();
    if (currentPage == pageNumbers) {
        var link = $pagesLinks[currentPage - 1];
        if (!!link) {
            request("https://www.tripadvisor.com/" + link, function (error, response, body) {
                if (!!body) {
                    this.fetchReviewPage(body).done(function () {
                        oDeferred.resolve(this);
                    }.bind(this));
                } else {
                    console.error("body error for link: " + link + " error: " + error);
                }
            }.bind(this));
        } else {
            oDeferred.resolve(this);
        }
        return oDeferred.promise();
    }

    var promise = this.getAllPageReviews(currentPage+1, pageNumbers, $pagesLinks);
    promise.done(function(){
        var link = $pagesLinks[currentPage - 1];
        if (!!link) {
            request("https://www.tripadvisor.com/" + link, function (error, response, body) {
                if (!!body) {
                    this.fetchReviewPage(body).done(function () {
                        oDeferred.resolve(this);
                    }.bind(this));
                } else {
                    console.error("body error for link: " + link + " error: " + error);
                }
            }.bind(this));
        } else {
            oDeferred.resolve(this);

        }
    }.bind(this));

    return oDeferred.promise();
};

Place.prototype.fetchReviewPage = function (body) {
    var oDeferred = jQuery.Deferred();
    var $ = cheerio.load(body);
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
            } else {
                console.error(error);
            }
            if (numResponses === numCalls) {
                oDeferred.resolve(this);
            }
        }.bind(this));
    }.bind(this));
    return oDeferred.promise();
};

Place.prototype.handleReviewResponse = function (error, response, body) {
    var review = new Review(body, this.name);
    this.reviews.push(review);
};

Place.Query = function (query) {
    var placesArr = [];
    var done = false;
    var oDeferred = jQuery.Deferred();
    request(query, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Fetch query succeeded: " + query);
            var $ = cheerio.load(body);
            var $places = $('.result');
            var numRequests = $places.length;
            var numResponses = 0;
            var numResponsesOfReviews = 0;
            $places.each(function (_, place) {
                var onClickText = $(place).attr("onclick");
                var link = onClickText.match(/.*((Restaurant|Attraction).*\.html).*/);
                if (link.length > 1) {
                    var linkPlace = 'https://www.tripadvisor.com/' + link[1]
                    request(linkPlace, function (error, response, body) {
                        numResponses++;
                        if (!error && response.statusCode == 200) {
                            var place = new Place(body);
                            place.fetchReviews(linkPlace).done(function (place) {
                                numResponsesOfReviews++;
                                placesArr.push(place);
                                if (done && numResponsesOfReviews == numResponses)
                                    oDeferred.resolve(placesArr);
                            })
                        } else {
                            console.error("reqeust for place: " + place + "request: " + linkPlace);
                        }
                        if (numResponses == numRequests) {
                            done = true;
                        }

                    });
                } else {
                    console.error("Link on place: " + place + "failed " + link);
                    numRequests--;
                }
            });
        } else {
            console.error("Fetch query failed: " + query);
        }
    });
    return oDeferred.promise();


};

module.exports = Place;