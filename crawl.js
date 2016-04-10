/**
 * Created by amir on 03/04/16.
 */

var mySqlProvider = require('./mySqlProvider.js');
var provider  = new mySqlProvider();

var Place = require('./place');
Place.Query().done(function (places) {
    provider.save(places);
});
