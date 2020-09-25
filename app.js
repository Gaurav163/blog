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

const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);

mongoose.Promise = global.Promise;

const uri = "mongodb+srv://Gaurav:Gaurav@63@cluster0.xar7x.mongodb.net/blog";
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

var userSchema = new Schema({
    id: Number,
    username: String,
    name: String,
    email: String,
    password: String,
    verify: String
})


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

app.get("/", (req, res) => {


    var name = "logedout";
    var time = parseInt(Date.now() / 60000);
    console.log(time);
    if (req.user) {
        name = req.user.name;
    }
    blog = bloog.find({}, (e, b) => {
        if (e) {
            console.log(e);
        } else {
            res.render("index", { name: name, blogs: b, time: time });
        }
    })


})

app.get("/login", checklogin, (req, res) => {
    res.render("login");
})

app.get("/register", (req, res) => {
    if (req.user) res.redirect("/");
    res.render("register", { message: mess });
    mess = "ok";
    console.log(mess);
})

app.post("/login", passport.authenticate('local', {

    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}))

app.post("/register", async(req, res) => {
    if (req.user) {
        res.redirect("/");
    } else {
        try {
            var hashpass = await bcrypt.hash(req.body.password, 10);

            var x = 0;

            for (var i = 0; i < users.length; i++) {
                console.log(i);
                if (users[i].username === req.body.username) {
                    mess = "Username Already Exist";
                    x = 1;
                    res.redirect("/register");
                } else if (users[i].email === req.body.email) {
                    mess = "Email Already Exist";
                    x = 1;
                    res.redirect("/register");

                }
            }
            var verifykey = (parseInt(Date.now() % 1000000).toString());

            if (x == 0) {
                await user.create({
                    id: Number(Date.now()),
                    username: req.body.username,
                    name: req.body.name,
                    email: req.body.email,
                    password: hashpass,
                    verify: verifykey

                }, (err, blog) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(blog);
                    }
                })
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: emailconname,
                        pass: emailconpass
                    }
                });
                var mailOptions = {
                    from: emailconname,
                    to: req.body.email,
                    subject: 'Confirmation mail for IIITBLOOGS',
                    text: "Hello " + req.body.username + "\n Here is OTP for confirmation gmail on IIITBLOOG: " + verifykey
                };
                await transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });


                await user.find({}, (e, b) => {
                    if (e) {
                        console.log(e);
                    } else {
                        users = b;
                    }
                })

                res.redirect("/confirm");
            }

        } catch (e) {
            res.redirect("/register");
            console.log(e);

        }

    }

})

app.get("/confirm", (req, res) => {
  
    res.render('verify');


});

app.post("/confirm", async(req, res) => {
    console.log(req.body.email);
    console.log(req.body.otp);
    var usercon = false;

    await user.find({ email: req.body.email }, (err, usr) => {
        console.log(usr);
        if (err) {
            console.log(err);

        } else if(usr) {

            if (req.body.otp == usr[0].verify) {
                usercon = true;
            } else {
                console.log("wrong otp");
            }
        }
    })
    if (usercon == true) {
        await user.updateOne({ email: req.body.email }, { $set: { verify: 'confirmed' } }, (err, res) => {
            if (err) {
                console.log(err);
            } else {
                console.log(res);
            }
        })
    }
    await user.find({}, (e, b) => {
                    if (e) {
                        console.log(e);
                    } else {
                        users = b;
                    }
                })
    res.redirect("/");

});

app.delete("/logout", (req, res) => {
    req.logOut()
    res.redirect("/");
})

app.get("/addblog", (req, res) => {

    if (req.user) {
        if (req.user.verify != 'confirmed') {
            res.redirect("/confirm");
        } else {
            res.render("addblog", { name: req.user.username })
        }

    } else {

        res.redirect("/login");

    }
})

app.post("/addblog", async(req, res) => {
    if (req.user) {
        var sbody = domPurify.sanitize(marked(req.body.body));
        await bloog.create({
                title: req.body.title,
                username: req.user.username,
                mid: req.user.username + (parseInt(Date.now() / 60000).toString()),
                body: req.body.body,
                sbody: sbody,
                comments: [],
                vote: 0,
                noc: 0,
                did: parseInt(Date.now() / 60000)


            },
            (err, blog) => {
                if (err) {
                    console.error(err);
                }
            })
        res.redirect("/");
    }


})

app.get("/editblog/:y", async(req, res) => {
    var y = req.params.y;
    var x = await bloog.findOne({ mid: y }, (err, blog) => {
        if (err) {
            console.log(err);
        }
    })
    if (req.user) {
        res.render("edit", { blog: x, x: y });
    } else {
        res.redirect("/login");
    }
})

app.post("/edit/:y", async(req, res) => {
    var x = {};
    await bloog.findOne({ mid: req.params.y }, (err, blog) => {
        if (err) {
            console.log(err);
        } else {
            x = blog;
        }
    })
    if (req.user) {
        if (req.user.username === x["username"]) {
            var sbody = domPurify.sanitize(marked(req.body.body));
            await bloog.update({ mid: req.params.y }, {
                title: x["title"],
                username: req.user.username,
                mid: x["mid"],
                body: req.body.body,
                sbody: sbody,
                comments: x["comments"],
                vote: 0,
                noc: 0,
                did: x["did"]


            }, (err, blog) => {
                if (err) {
                    console.error(err);
                }
            })
            res.redirect("/");
        } else {
            res.redirect("/");
        }
    } else {
        res.redirect("/login");
    }


})


app.post("/addcomment/:id", async(req, res) => {
    if(req.user){
    if (req.user.verify != "confirmed") {
        res.redirect("/confirm");
    }
    }
    var sbody = domPurify.sanitize(marked(req.body.body));
    if (req.user) {
        await bloog.findOneAndUpdate({ mid: req.params.id }, {
            $push: {
                comments: {
                    username: req.user.username,
                    body: req.body.body,
                    sbody: sbody,
                    mid: req.user.username + toString(parseInt(Date.now() / 600000)),
                    did: parseInt(Date.now() / 60000),
                    reply_to: req.body.username
                }
            }
        })
        res.redirect("/blog/" + req.params.id.toString());

    } else {
        res.redirect("/login");
    }
})

app.get("/myblogs", async(req, res) => {
    if (req.user) {
        var name = "logedout";
        var time = parseInt(Date.now() / 60000);
        console.log(time);
        if (req.user) {
            name = req.user.name;
        }
        blog = bloog.find({ username: req.user.username }, (e, b) => {
            if (e) {
                console.log(e);
            } else {
                res.render("myblogs", { name: name, blogs: b, time: time });
            }
        })
    } else {
        res.redirect("/login");
    }
})

app.get("/blog/:id", async(req, res) => {

    var name = "logedout";
    var time = parseInt(Date.now() / 60000);
    console.log(time);
    if (req.user) {
        name = req.user.name;
    }
    blog = bloog.findOne({ mid: req.params.id }, (e, b) => {
        if (e) {
            console.log(e);
        } else {
            res.render("expand", { name: name, blog: b, time: time });
        }
    })

})






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



app.listen(process.env.PORT || 5000, () => console.log('Server started on 5000!'));
