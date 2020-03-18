var express = require('express');
var router = express.Router();
const User = require('../models/user');
const LaundryPickup = require('../models/laundry-pickup');

router.use((req, res, next) => {
    if (req.session.currentUser) {
        next();
        return;
    }

    res.redirect('/auth/login');
});

router.get('/dashboard', (req, res, next) => {
    let query;

    if (req.session.currentUser.isLaunderer) {
        query = {
            launderer: req.session.currentUser._id
        };
    } else {
        query = {
            user: req.session.currentUser._id
        };
    }

    LaundryPickup
        .find(query)
        .populate('user', 'name')
        .populate('launderer', 'name')
        .sort('pickupDate')
        .exec((err, pickupDocs) => {
            if (err) {
                next(err);
                return;
            }

            res.render('laundry/dashboard', {
                pickups: pickupDocs
            });
        });
});

router.get('/launderers', (req, res, next) => {
    User.find({
            $and: [{
                    isLaunderer: true
                },
                {
                    _id: {
                        $ne: req.session.currentUser._id
                    }
                }
            ]
        },
        (err, launderersList) => {
            if (err) {
                next(err);
                return;
            }
            res.render('laundry/launderers', {
                launderers: launderersList
            });
        }
    );
});

router.post("/launderers", (req, res, next) => {
    const userId = req.session.currentUser._id;
    const laundererInfo = {
        fee: req.body.fee,
        isLaunderer: true
    }
    User.findByIdAndUpdate(userId, laundererInfo, {
        new: true
    }, (err, theUser) => {
        if (err) {
            next(err);
            return;
        }
        req.session.currentUser = theUser;
        res.redirect("/laundry/dashboard")
    })
})


router.post('/laundry-pickups', (req, res, next) => {
    const pickupInfo = {
        pickupDate: req.body.pickupDate,
        launderer: req.body.laundererId,
        user: req.session.currentUser._id
    };

    const thePickup = new LaundryPickup(pickupInfo);

    thePickup.save((err) => {
        if (err) {
            next(err);
            return;
        }

        res.redirect('/laundry/dashboard');
    });
});


router.get("/launderers/:id", (req, res, next) => {
    const laundererId = req.params.id

    User.findById(laundererId, (err, theUser) => {
        if (err) {
            next(err);
            return;
        }
        res.render("laundry/launderer-profile", {
            theLaunderer: theUser
        });
    });
});

router.get("/launderers/:id", (req, res, next) => {
    const laundererId = req.params.id;
    User.findById(laundererId, (err, theUser) => {
        if (err) {
            next(err);
            return;
        }

        res.render('laundry/launderer-profile', {
            theLaunderer: theUser
        });
    });
});

module.exports = router;