var express = require("express");

var router = express.Router();

// Import the model to use its database functions.
var db = require("../models");
var isAuthenticated = require("../config/middleware/isAuthenticated");


router.get("/viewuser/:user_id", isAuthenticated, function (req, res) {

    db.User.findOne({
        where: {
            userId: req.params.user_id
        },
        include: [
            {
                model: db.Follower,
                where: {
                    followerId: req.user.userId,
                    followedId: req.params.user_id
                },
                required: false
            }
        ]
    }).then(function (userdata) {
        db.Post.findAll({
            where: {
                userId: req.params.user_id
            },
            order: [
                ['createdAt', 'DESC']
            ],
            limit: 5,
        }).then(function (postdata) {
            userdata.getFolloweds().then(function (followeddata) {
                userdata.getSubscriptions().then(function (subbeddata) {
                    var hbsObject = {
                        myProfile: (req.params.user_id == req.user.userId),
                        profile: userdata,
                        posts: postdata,
                        followeds: followeddata,
                        subscriptions: subbeddata,
                    };
                    res.renderWithContext("viewuser", hbsObject);
                });
            });
        });
    })
});

router.get("/editprofile", isAuthenticated, function (req, res) {
    var hbsObject = {};
    console.log(hbsObject);

    res.renderWithContext("editprofile", hbsObject);
});

router.post("/editprofile", isAuthenticated, function (req, res) {
  var changes = {
    name: req.body.name,
    avatar: req.body.avatar,
    coverImg: req.body.coverImg,
    rank: req.body.rank,
    branch: req.body.branch,
    deployment: req.body.deployment,
    mos: req.body.mos,
    bio: req.body.bio,
  };

  db.User.update(changes, {
    where: { userId: req.user.userId },
  }).then(function () {
    res.redirect("/viewuser/" + req.user.userId);
  });
});

module.exports = router;
