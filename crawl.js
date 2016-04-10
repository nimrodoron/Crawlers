/**
 * Created by amir on 03/04/16.
 */

/*
var Place = require('./place');
Place.Query();
*/

var Crawler = function() {
};


Crawler.prototype.Crawl = function (query) {
    this.baseQuery = query;
    this.getNumPages().done(function(numPages){
        var i=0;
        while (i<numPages) {
            var pageId = i*30;
            var pageQuery = 'https://www.tripadvisor.com/Search?q='+query+'&geo=293984#&o='+pageId;
            Place.Query(pageQuery).done(function(placesArr){
                console.log(placesArr);
            });
            i++;
        }
    });
};

Crawler.prototype.getNumPages = function(){
    var oDeferred = jQuery.Deferred();
    var query = 'https://www.tripadvisor.com/Search?q='+this.baseQuery+'&geo=293984';
    request(query, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            var numPages = $('.pageNumber').last().text();
            oDeferred.resolve(numPages);
        } else {
            oDeferred.reject(error);
        }
    }.bind(this));
    return oDeferred.promise();
};