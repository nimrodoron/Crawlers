/**
 * Created by amir on 03/04/16.
 */
var Review = function (dom) {
    var $ = cheerio.load(dom);
    this.title = $('.innerBubble').first().find('.quote').text();
    this.rating = $($('.rating').find('img')).attr('alt')[0];
    this.body = $('.innerBubble').first().find('.entry').text();
};

module.exports = Review;