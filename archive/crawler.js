var $ = require('jquery');
var ResultPage = require('result_page');

var crawler = function() {

};

crawler.queryTripAdvisor = function(query) {
    var oDeferred = $.Deferred();

    var url = this._generateCrawlQuery(query);
    this._crawlTripAdvisor(url).done(function(result_page){
        oDeferred.resolve(result_page)
    }).fail(function(err){
        oDeferred.reject(err);
    });

    return oDeferred.promise();

};

//Need To Override
crawler._generateCrawlQuery = function (query) {

};

crawler._crawlTripAdvisor = function (query) {

    var oDeferred = $.Deferred();
    request(query, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var result_page = new ResultPage(body);
            oDeferred.resolve(result_page);
        } else {
            oDeferred.reject(error)
        }
    });
    return oDeferred.promise();
};

crawler.crawl = function(query) {
    this.queryTripAdvisor(query).done(function(resultPage){
        var oDeferred = $.Deferred();
        var allPagesArr = [];
        var callBackCounter = 0;
        while (resultPage.hasNextPlaceEntry()) {
            var resultPlace = resultPage.nextPlaceEntry();
            resultPage.getPlaceReviews(resultPlace).done(function(reviewsCollection){
                resultPlace.setReviews(reviewsCollection);
                allPagesArr.add(resultPlace);
            }).fail(function(err){
                console.log(err);
            }).all(function() {
                callBackCounter++;
            })
        }

    })
};


module.exports = crawler;
