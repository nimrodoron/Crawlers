/**
 * Created by amir on 03/04/16.
 */


var Place = require('./place');
var jQuery = require('jquery-deferred');

var Crawler = function() {
};

Crawler.prototype.Crawl = function (query) {
    this.baseQuery = query;
/*    provider.init().done(function (obj) {
        this.getNumPages().done(function(numPages){
            this.query(0, query, numPages);
        }.bind(this));
    }.bind(this));*/
    this.query(0, query, 1);
};

Crawler.prototype.query = function (i, query, numPages) {
    if (i == numPages) return;
    var pageId = i*30;
    var pageQuery = 'https://www.tripadvisor.com/Search?q='+query+'&ajax=search&actionType=updatePage&geo=293984#&o='+pageId;
    Place.Query(pageQuery).done(function(placesArr){
        this.query(++i, query, numPages)
    }.bind(this));
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

var crawler = new Crawler();
crawler.Crawl("Bar");