/**
 * Created by nimrod on 09/04/16.
 */
Place = require('./place.js');
Q = require('q');
var insertPlacesSql = "INSERT INTO t_places (name, description, country, locality, street) VALUES ?";
var insertReviewsSql = "INSERT INTO t_reviews (place_id, title, rating, body) VALUES ?";

var mySqlProvider = function () {
    this.mysql = require("mysql");

    this.conn = this.mysql.createConnection({
        host: 'localhost',
        user: 'trippy2',
        password: 'trippy2',
        database: 'trippy2',
        port :'3306'
    });

};

mySqlProvider.prototype.save = function (places)
{
    this.conn.connect(function(err){
        if(err){
            console.log('Error connecting to Db');
            return;
        }
        console.log('Connection established');
        var values = [];
        if (!!places) {
            places.forEach(function (place) {
                var val = [];
                if (!!place.name && !!place.description && !!place.country && !!place.locality && !!place.street) {
                    val.push(place.name, place.description, place.country, place.locality, place.street);
                    values.push(val);
                } else {
                    console.error("Place is not valid:" + place);
                }
            }, this);
        }
        console.log('Insert places:' + values);
        this.conn.query(insertPlacesSql, [values], function(err,res){
            if(err) {
                console.log(err);
                this.conn.end();
            } else {
                console.log('places inserted successfully Last insert ID:', res.insertId);
                values = [];
                var index = 1;
                if (!!places) {
                    places.forEach(function (place) {
                        if (!!place.reviews) {
                            place.reviews.forEach(function (review) {
                                var val = [];
                                if (!!review.title && !!review.rating && review.body) {
                                    review.placeId = res.insertId - res.affectedRows + index + 1;
                                    val.push(review.placeId, review.title, review.rating, review.body);
                                    values.push(val);

                                } else {
                                    console.error("review: " + review + " is not valid for place:" + place);
                                }

                            }.bind(this));
                        }
                        index++;
                    }, this);
                }
                console.log('Insert reviews:' + values);
                this.conn.query(insertReviewsSql, [values], function(err,res) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log('reviews inserted successfully Last insert ID:', res.insertId);
                    }
                    this.conn.end();
                }.bind(this));
            }
        }.bind(this));

    }.bind(this));
};

module.exports = mySqlProvider;


/*
var test  = new mySqlProvider();
var places = [];
var place = new Place();
place.name = "test";
place.description = "desc";
place.country = "Israel";
place.locality = "Israeli";
place.street = "Sokolov";
var rev1 = new Review();
rev1.body = "body1";
rev1.title = "title1";
rev1.rating = "5";
var rev2 = new Review();
rev2.body = "body2";
rev2.title = "title2";
rev2.rating = "5";
place.reviews.push(rev1, rev2);

var place2 = new Place();
place2.name = "test2";
place2.description = "desc";
place2.country = "Israel";
place2.locality = "Israeli";
place2.street = "Sokolov";
var rev3 = new Review();
rev3.body = "body3";
rev3.title = "title3";
rev3.rating = "5";
place2.reviews.push(rev3);
places.push(place);
places.push(place2);
test.save(places);*/
