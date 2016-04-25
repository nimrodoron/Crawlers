/**
 * Created by amir on 03/04/16.
 */
var mySqlProvider = require('./mySqlProvider.js');
var provider  = new mySqlProvider();

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
    lastlink = $('.pageNumbers').children("a").last().attr("href");
    var pattern = /.*-(or([0-9]+))-.*/i;
    var res = pattern.exec(lastlink);
    lastnum = parseInt(res[2]);
    for (i= 10; i <= lastnum; i=i+10) {
        var sub = 'or' + i;
        var link = lastlink.replace(res[1], sub);
        links.push(link);
    }
    /*
        .each ( function() {
        var link = this.attribs.href;
        links.push(link);
    });
*/    this.fetchReviewPage(this.dom).done( function() {
        if (links.length > 0) {
            var result = Q();
            links.forEach(function (link) {
                result = result.then( function() {
                    return this.getAllPageReviews(link);
                }.bind(this)) ;
            }.bind(this));

            result.then(function() {
                oDeferred.resolve(this);
            }.bind(this));

        } else {
            oDeferred.resolve(this);
        }
    }.bind(this));

    return oDeferred.promise();
};

Place.prototype.getAllPageReviews = function (link) {
    var oDeferred = jQuery.Deferred();
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
};

Place.prototype.fetchReviewPage = function (body) {
    var oDeferred = jQuery.Deferred();
    var $ = cheerio.load(body);
    var $quotes = $('.quote');
    var numCalls = $quotes.length;
    var numResponses = 0;
    $quotes.each(function (_, entry) {
        var url2 = $(entry).find('a');
        if (!!url2 && !!(url2).attr('href')) {
            url2 = $(url2).attr('href');
            request("https://www.tripadvisor.com/" + url2, function (error, response, body) {
                numResponses++;
                if (!error && response.statusCode == 200) {
                    this.handleReviewResponse(error, response, body);
                } else {
                    console.error("Error: " + error + " Status code: " + response.statusCode + " url: " + url2);
                }
                if (numResponses === numCalls) {
                    oDeferred.resolve(this);
                }
            }.bind(this));
        }
    }.bind(this));
    return oDeferred.promise();
};

Place.prototype.handleReviewResponse = function (error, response, body) {
    var review = new Review(body, this.name);
    this.reviews.push(review);
};

Place.handlePlace = function($, placeLink) {
    var oDeferred = jQuery.Deferred();
    var onClickText = $(placeLink).attr("onclick");
    var link = onClickText.match(/.*((Restaurant|Attraction).*\.html).*/);
    if (link.length > 1) {
        var linkPlace = 'https://www.tripadvisor.com/' + link[1]
        request(linkPlace, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var place = new Place(body);
                place.fetchReviews(linkPlace).done(function (place) {
                    provider.save(place);
                    oDeferred.resolve(place);
                })
            } else {
                console.error("reqeust for place: " + place + "request: " + linkPlace);
            }
        });
    } else {
        oDeferred.reject();
        console.error("Link on place: " + place + "failed " + link);
    }
    return oDeferred.promise();
};

Place.Query = function (query) {
    var oDeferred = jQuery.Deferred();
    request(query, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Fetch query succeeded: " + query);
            var $ = cheerio.load(body);
            var $places = $('.result');
            var result = Q();
            $places.each(function (_, placeLink) {
                result = result.then( function() {
                    var oDfr = jQuery.Deferred();
                    var place = new Place()
                    Place.handlePlace($, placeLink).then( function() {
                        oDfr.resolve();
                    }.bind(this));
                    return oDfr.promise();
                }.bind(this))
            }.bind(this));

            result.then(function() {
                oDeferred.resolve();
            });
        } else {
            console.error("Fetch query failed: " + query);
        }
    }.bind(this));
    return oDeferred.promise();


};



module.exports = Place;