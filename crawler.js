
var http = require('http'),
    request = require('request'),
    cheerio = require('cheerio');

request('https://www.tripadvisor.com/Search?q=Bars&geo=293984&pid=3825&typeaheadRedirect=true&redirect=&startTime=undefined&uiOrigin=undefined&returnTo=__2F__', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        var places = $('.result');
        console.log(places);
        places.forEach(function(place){
            var onClickText = place.attr("onclick");
            var link = onClickText.match(/.*(Restaurant.*\.html).*/gi);
            console.log(link) // Show the HTML for the Google homepage.
        });
        console.log(places) // Show the HTML for the Google homepage.
    }
})