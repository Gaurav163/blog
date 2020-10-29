const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const cookieParser = require('cookie-parser');

var marked = require("marked");
var createDom = require("dompurify");
var { JSDOM } = require("jsdom");
var domPurify = createDom(new JSDOM().window);
var nodemailer = require('nodemailer');
var emailconname = "iiitbloog@gmail.com";
var emailconpass = "Gaurav@63";
var reg_req = "http://contest-iiitp2.centralindia.azurecontainer.io:5000/users/register/";

const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);

mongoose.Promise = global.Promise;

const uri = "mongodb+srv://piyushg9794:passwordnahi@123@contest.j9ls1.mongodb.net/logsn";
mongoose.connect(uri, () => console.log("App Db success"))
    .catch(err => console.log(err));


var age = 7 * 24 * 60 * 60 * 1000;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.use(session({
    cookie: {
        maxAge: age
    },
    secret: 'btpsecret',
    saveUninitialized: false,
    resave: false
}));
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'));
app.use(cookieParser());



var Schema = mongoose.Schema;


var BlogSchema = new Schema({
    title: String,
    username: String,
    mid: String,
    body: String,
    sbody: String,
    type: String,
    comments: [{
        username: String,
        body: String,
        sbody: String,
        mid: String,
        did: Number,
        reply_to: String

    }],
    vote: Number,
    noc: Number,
    did: Number
})

const userSchema = new Schema({
    email: String,
    username: String,
    password: String,
    secretToken: String,
    contact: String,
    role: String,
    active: Boolean,
    flang: String,
    template: String



}, {
    timestamp: {
        createdAt: 'createdAt',
        upadateAt: 'upadateAt'
    }
});




var bloog = mongoose.model("bloog", BlogSchema);
var user = mongoose.model("user", userSchema);
var users = []
var mess = "ok";

user.find({}, (err, body) => {
    if (err) {
        console.log(err)
    } else {
        users = body;
    }
})
console.log(users);

const initializePassport = require("./passport-config");
initializePassport(passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

app.get("/", async(req, res) => {

    res.redirect("/all/1");


});

app.get("/all/:page", async(req, res) => {
    var page = Number(req.params.page) || 1;
    var name = "logedout";
    var time = parseInt(Date.now() / 60000);
    console.log(time);
    var username;
    var name = "logedout";
    var pagename = "all";
    if (req.user) {
        name = req.user.username;
        username = req.user.username;
    }

    blog = await bloog.find({});

    var numofresults = 25;

    var last = Math.ceil(blog.length / (numofresults));
    var prev = Math.max(page - 1, 1);
    var next = Math.min(page + 1, last);
    var mid = Math.floor((page + last) / 2);
    var midp = Math.floor((page + 1) / 2);

    var f = 1;
    var i1, i2;
    i1 = (Math.max((page - 1), 0) * (numofresults));
    i2 = i1 + numofresults;

    var checkm = true,
        checkp = true;

    if (midp === page) checkp = false;
    if (mid === page) checkm = false;

    res.render("index", {
        name: usrr(req),
        blogs: blog.slice(i1, i2),
        time: time,
        pagename: pagename,
        username: username,
        prev: prev,
        mid: mid,
        midp: midp,
        next: next,
        first: f,
        checkp: checkp,
        checkm: checkm,
        last: last,
        page: page,
        nos: numofresults
    });
})

app.get("/login", checklogin, (req, res) => {

    if (req.user) {
        req.flash("error", "Already Signed In");
        res.redirect("/");
    }
    res.render("login", { name: usrr(req) });
})
app.get("/updateUser", (req, res) => {

    user.find({}, (err, body) => {
        if (err) {
            console.log(err)
        } else {
            users = body;
        }
    })

    res.send("user added");

})

app.get("/register", (req, res) => {
    if (req.user) {
        req.flash("error", "Please Logout to Register")
        res.redirect("/");
    } else {
        res.redirect(reg_req);
    }

})

app.post("/login", passport.authenticate('local', {

    successRedirect: "/",
    failureRedirect: "/",
    failureFlash: true
}))



app.delete("/logout", (req, res) => {
    if (req.user) {
        req.logOut();
        req.flash("confirm", "Logged Out success");
        res.redirect("/");
    } else {
        req.flash("error", " Already Logged Out");
        res.redirect("/");
    }

})

app.get("/addblog", (req, res) => {

    if (req.user) {
        if (req.user.active != true) {
            res.flash("error", "User unverified");
            res.redirect("/");
        } else {
            res.render("addblog", { name: req.user.username })
        }

    } else {
        req.flash("error", "Please Sign in to Write Blog");
        res.redirect("/");

    }
})

app.post("/addblog", async(req, res) => {
    if (req.user) {
        if (req.user.active != true) {
            res.flash("error", "User unverified");
            res.redirect("/");
        } else {
            var text = stradd(req.body.body);
            var sbody = domPurify.sanitize(marked(text));
            await bloog.create({
                    title: req.body.title,
                    username: req.user.username,
                    mid: req.user.username + (parseInt(Date.now() / 60000).toString()),
                    body: text,
                    sbody: sbody,
                    type: req.body.type,
                    comments: [],
                    vote: 0,
                    noc: 0,
                    did: parseInt(Date.now() / 60000)


                },
                (err, blog) => {
                    if (err) {
                        console.error(err);
                    } else {
                        req.flash("confirm", "Blog added success");
                    }
                })
            res.redirect("/");
        }
    } else {
        res.flash("error", "Please Sign In to Write Blog");
        res.redirect("/");
    }


})

app.get("/editblog/:y", async(req, res) => {
    var y = req.params.y;
    var x = {};
    await bloog.findOne({ mid: y }, (err, blog) => {
        if (err) {
            console.log(err);
        } else {
            x = blog;
        }
    })
    if (req.user) {
        if (req.user.username == x.username) {
            console.log(x);
            res.render("edit", { blog: x, x: y, name: usrr(req) });
        } else {
            req.flash("error", "Edit Request denied");
        }
    } else {
        req.flash("error", "Please Sign In to Write Blog");
        res.redirect("/");
    }
})

app.post("/edit/:y", async(req, res) => {
    var x = await bloog.findOne({ mid: req.params.y }, (err, blog) => {
        if (err) {
            console.log(err);
        }
    });
    if (req.user) {
        if (req.user.username == x["username"]) {
            var text = stradd(req.body.body);
            var sbody = domPurify.sanitize(marked(text));
            await bloog.updateOne({ mid: req.params.y }, {
                title: x["title"],
                username: req.user.username,
                mid: x["mid"],
                body: req.body.body,
                sbody: sbody,
                type: req.body.type,
                comments: x["comments"],
                vote: 0,
                noc: 0,
                did: x["did"]


            }, (err, blog) => {
                if (err) {
                    req.flash("error", "Blog Edited Fail");
                    console.error(err);
                } else {
                    req.flash("confirm", "Blog Edited success");
                }
            })
            res.redirect("/");
        } else {
            req.flash("error", "Blog Edit Denied");
            res.redirect("/");
        }
    } else {
        res.flash("error", "Please Sign In to Write Blog");
        res.redirect("/");
    }


})


app.post("/addcomment/:id", async(req, res) => {


    var blg = "/blog/" + req.params.id;

    if (req.user) {
        if (req.user.active != true) {
            req.flash("error", "user unverified");
            res.redirect(blg);
        }
    }

    var text = stradd(req.body.body);
    var sbody = domPurify.sanitize(marked(text));
    if (req.user && req.user.active == true) {
        await bloog.findOneAndUpdate({ mid: req.params.id }, {
            $push: {
                comments: {
                    username: req.user.username,
                    body: req.body.body,
                    sbody: sbody,
                    mid: req.user.username + (parseInt(Date.now()).toString()),
                    did: parseInt(Date.now() / 60000),
                    reply_to: req.body.username
                }
            }
        })

    } else {
        res.flash("error", "Please Sign In to Write Blog");
        res.redirect("/");
    }
})

app.get("/myblogs/:page", async(req, res) => {
    if (req.user) {
        var name = "logedout";
        var time = parseInt(Date.now() / 60000);
        console.log(time);
        if (req.user) {
            name = req.user.username;
        }
        var blog = await bloog.find({ username: req.user.username });
        var page = Number(req.params.page);
        if (blog.length) {

            var pagename = "myblogs";
            var numofresults = 25;

            var last = Math.ceil(blog.length / (numofresults));
            var prev = Math.max(page - 1, 1);
            var next = Math.min(page + 1, last);
            var mid = Math.floor((page + last) / 2);
            var midp = Math.floor((page + 1) / 2);

            var f = 1;
            var i1, i2;
            i1 = (Math.max((page - 1), 0) * (numofresults));
            i2 = i1 + numofresults;

            var checkm = true,
                checkp = true;
            if (midp === page) checkp = false;
            if (mid === page) checkm = false;
            res.render("index", {
                username: usrr(req),
                pagename: pagename,
                name: usrr(req),
                blogs: blog.slice(i1, i2),
                time: time,
                prev: prev,
                mid: mid,
                midp: midp,
                next: next,
                first: f,
                checkp: checkp,
                checkm: checkm,
                last: last,
                page: page,
                nos: numofresults
            });
        } else {
            req.flash("error", "You Have Not Write Any Blog");
            res.redirect("/");
        }

    } else {
        req.flash("error", "Please login to See Your Blog");
        res.redirect("/");
    }
})

app.get("/discussion", (req, res) => {
    res.redirect("/discussion/1");
})
app.get("/resource", (req, res) => {
    res.redirect("/resource/1");
})
app.get("/announcement", (req, res) => {
    res.redirect("/announcement/1");
})

app.get("/discussion/:page", async(req, res) => {

    var time = parseInt(Date.now() / 60000);
    var page = Number(req.params.page);

    var blog = await bloog.find({ type: "Discussion" });
    if (blog.length) {

        var pagename = "discussion";
        var numofresults = 25;

        var last = Math.ceil(blog.length / (numofresults));
        var prev = Math.max(page - 1, 1);
        var next = Math.min(page + 1, last);
        var mid = Math.floor((page + last) / 2);
        var midp = Math.floor((page + 1) / 2);

        var f = 1;
        var i1, i2;
        i1 = (Math.max((page - 1), 0) * (numofresults));
        i2 = i1 + numofresults;

        var checkm = true,
            checkp = true;
        if (midp === page) checkp = false;
        if (mid === page) checkm = false;
        res.render("index", {
            username: usrr(req),
            pagename: pagename,
            name: usrr(req),
            blogs: blog.slice(i1, i2),
            time: time,
            prev: prev,
            mid: mid,
            midp: midp,
            next: next,
            first: f,
            checkp: checkp,
            checkm: checkm,
            last: last,
            page: page,
            nos: numofresults
        });
    } else {
        req.flash("error", "There is no discussion");
        res.redirect("/");
    }

})
app.get("/announcement/:page", async(req, res) => {

    var time = parseInt(Date.now() / 60000);
    var page = Number(req.params.page);

    var blog = await bloog.find({ type: "Announcement" });

    var pagename = "announcement";
    if (blog.length) {
        var numofresults = 25;

        var last = Math.ceil(blog.length / (numofresults));
        var prev = Math.max(page - 1, 1);
        var next = Math.min(page + 1, last);
        var mid = Math.floor((page + last) / 2);
        var midp = Math.floor((page + 1) / 2);

        var f = 1;
        var i1, i2;
        i1 = (Math.max((page - 1), 0) * (numofresults));
        i2 = i1 + numofresults;

        var checkm = true,
            checkp = true;
        if (midp === page) checkp = false;
        if (mid === page) checkm = false;

        res.render("index", {
            username: usrr(req),
            pagename: pagename,
            name: usrr(req),
            blogs: blog.slice(i1, i2),
            time: time,
            prev: prev,
            mid: mid,
            midp: midp,
            next: next,
            first: f,
            checkp: checkp,
            checkm: checkm,
            last: last,
            page: page,
            nos: numofresults
        });

    } else {
        req.flash("error", "There is no announcements");
        res.redirect("/");
    }


})
app.get("/resource/:page", async(req, res) => {

    var time = parseInt(Date.now() / 60000);
    var page = Number(req.params.page);

    var blog = await bloog.find({ type: "Resource" });
    if (blog.length) {

        var pagename = "resource";
        var numofresults = 25;

        var last = Math.ceil(blog.length / (numofresults));
        var prev = Math.max(page - 1, 1);
        var next = Math.min(page + 1, last);
        var mid = Math.floor((page + last) / 2);
        var midp = Math.floor((page + 1) / 2);

        var f = 1;
        var i1, i2;
        i1 = (Math.max((page - 1), 0) * (numofresults));
        i2 = i1 + numofresults;

        var checkm = true,
            checkp = true;
        if (midp === page) checkp = false;
        if (mid === page) checkm = false;
        res.render("index", {
            username: usrr(req),
            pagename: pagename,
            name: usrr(req),
            blogs: blog.slice(i1, i2),
            time: time,
            prev: prev,
            mid: mid,
            midp: midp,
            next: next,
            first: f,
            checkp: checkp,
            checkm: checkm,
            last: last,
            page: page,
            nos: numofresults
        });
    } else {
        req.flash("error", "There is no resource");
        res.redirect("/");
    }

})
app.get("/userblog/:username", (req, res) => {
    res.redirect("/userblog/" + req.params.username + "/1");
})


app.get("/userblog/:username/:page", async(req, res) => {

    var time = parseInt(Date.now() / 60000);
    var page = Number(req.params.page);

    var blog = await bloog.find({ username: req.params.username });
    if (blog.length) {

        var pagename = "userblog" + req.params.username;
        var numofresults = 25;

        var last = Math.ceil(blog.length / (numofresults));
        var prev = Math.max(page - 1, 1);
        var next = Math.min(page + 1, last);
        var mid = Math.floor((page + last) / 2);
        var midp = Math.floor((page + 1) / 2);

        var f = 1;
        var i1, i2;
        i1 = (Math.max((page - 1), 0) * (numofresults));
        i2 = i1 + numofresults;

        var checkm = true,
            checkp = true;
        if (midp === page) checkp = false;
        if (mid === page) checkm = false;
        res.render("index", {
            username: usrr(req),
            pagename: pagename,
            name: usrr(req),
            blogs: blog.slice(i1, i2),
            time: time,
            prev: prev,
            mid: mid,
            midp: midp,
            next: next,
            first: f,
            checkp: checkp,
            checkm: checkm,
            last: last,
            page: page,
            nos: numofresults
        });
    } else {
        req.flash("error", "There is no blog by " + req.params.username);
        res.redirect("/");
    }


})

app.get("/blog/:id", async(req, res) => {

    var name = "logedout";
    var time = parseInt(Date.now() / 60000);
    console.log(time);
    if (req.user) {
        name = req.user.username;
    }
    blog = bloog.findOne({ mid: req.params.id }, (e, b) => {
        if (e) {
            req.flash("error", "Some Error to Open Blog.");
            res.redirect("/");
        } else if (b) {
            res.render("expand", { name: name, blog: b, time: time });
        } else {
            req.flash("error", "Blog Not exits");
            res.redirect("/");
        }
    })

})

app.get("/deletecomment/:bid/:cid", async(req, res) => {

    if (req.user) {
        var un = req.user.username;
        var re = "/blog/" + req.params.bid;
        var x;
        await bloog.findOne({ mid: req.params.bid }, (err, blog) => {
            if (err) {
                console.log(err);
            } else {
                x = blog;
            }
        })

        var y = "?";
        var z = req.params.cid;
        for (var i = 0; i < x.comments.length; i++) {
            if (x.comments[i].mid == z) {
                y = x.comments[i].username;
                break;
            }
        }
        if (y != "?") {
            if (y == un || x.username == un) {
                await bloog.updateOne({ "mid": req.params.bid }, { $pull: { "comments": { "mid": req.params.cid } } }, (e, b) => {
                    if (e) {
                        console.log(e);
                    } else {

                        res.send("comment deleted");
                    }
                });

                // res.redirect(re);

            } else {
                res.send("Request Declined");

            }
        } else {
            res.send("Comment not exist");

        }


    } else {
        res.send("Please login");
    }


})


function usrr(req) {
    if (req.user) {
        return req.user.username;
    } else {
        return "logedout";
    }
}



function chechAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
}

function checklogin(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    return next();
}

function stradd(x) {
    var ans = "";
    for (var i = 0; i < x.length; i++) {


        if (x[i] == "\n") {
            ans += "  \n";

        } else {
            ans += x[i];
        }

    }
    return ans;
}

app.use((req, res, next) => {
    req.flash('error', 'Page not found');
    res.redirect('/');
})

app.listen(process.env.PORT || 3000, () => console.log('Server started on 3000!'));