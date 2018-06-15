var express = require("express");
var sequelize = require('sequelize');

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
            include: [
                { model: db.User },
            ],
            limit: 5,
        }).then(function (postdata) {
            userdata.getFolloweds().then(function (followeddata) {
                userdata.getSubscriptions({
                    attributes: {
                        include: [
                            [sequelize.fn('COUNT', sequelize.col('Posts.postId')), 'postCount'],
                        ],
                    },
                    group: "Thread.threadId",
                    include: [
                        { model: db.User },
                        {
                            model: db.Post,
                            attributes: [],
                        },
                    ],
                }).then(function (subbeddata) {
                    for (let subbed of subbeddata) {
                        subbed.Subscriptions = true;
                    };

                    db.User.findById(req.user.userId).then(function (currentUser) {
                        console.log("in the router, getting all events, before rendering the view ");
                        currentUser.getEvent_ID(
                            { include: [{ model: db.User, as: "User_Id" }, { model: db.User, as: "EventCreator" }] }
                        ).then(function (attendEvents) {

                            var hbsObject = {
                                myProfile: (req.params.user_id == req.user.userId),
                                profile: userdata,
                                posts: postdata,
                                followeds: followeddata,
                                subscriptions: subbeddata,
                                userAttendEvents: attendEvents

                            };
                            res.renderWithContext("viewuser", hbsObject);
                        });
                    });
                });
            })
        });
    });
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
