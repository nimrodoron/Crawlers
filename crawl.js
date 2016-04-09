/**
 * Created by amir on 03/04/16.
 */


var http = require('http'),
    request = require('request'),
    cheerio = require('cheerio'),
    Place = require('./place.js');

request('https://www.tripadvisor.com/Search?q=Bars&geo=293984&pid=3825&typeaheadRedirect=true&redirect=&startTime=undefined&uiOrigin=undefined&returnTo=__2F__', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        $('.result').each(function (_, place) {
            var onClickText = $(place).attr("onclick");
            var link = onClickText.match(/.*((Restaurant|Attraction).*\.html).*/);
            if (link.length > 1) {
                request('https://www.tripadvisor.com/' + link[1], function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var place = new Place(body);
                        place.fetchReviews().done(function(place){
                            console.log(place);
                        })
                    }
                });
            }
        });
    }
});