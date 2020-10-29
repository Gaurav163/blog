const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

function initialize(passport, getUserByEmail, getUserById) {

    const authenticateuser = async(email, password, done) => {
        const user = getUserByEmail(email);

        if (user == null) {
            return done(null, false, { message: "No user with that email" });
        }

        try {
            if (password == user.password || await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: "Wrong Password !" });
            }
        } catch (e) {
            return done(e);
        }

    }


    passport.use(new localStrategy({ usernameField: "email" }, authenticateuser))
    passport.serializeUser((user, done) => done(null, user))
    passport.deserializeUser((user, done) => {
        return done(null, user);
    })

}

module.exports = initialize