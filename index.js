const cookieParser = require('cookie-parser')
const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const qs = require('querystring');

const SlackStrategy = require('passport-slack-oauth2').Strategy;

const app = express();

const port = process.env.PORT || 3000;

const private = fs.readFileSync('./keys/login.pem');
const public = fs.readFileSync('./keys/login.public.pem');

const cookie = "jwt_token";

passport.use(new SlackStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    tokenURL: "https://cardboardklatch.slack.com/api/oauth.access",
    authorizationURL: "https://cardboardklatch.slack.com/oauth/authorize",
    callbackURL: process.env.NODE_ENV === "production" ? "https://login.18xxdepot.com/auth/slack/callback" : "http://localhost:3000/auth/slack/callback",
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

app.disable('x-powered-by');
app.use(cookieParser())
app.use(passport.initialize());

app.get('/', (req, res) => {
    let redirect = req.query.redirect || req.get('Referrer') || "https://18xxdepot.com/";

    res.redirect(`/auth/slack?${qs.encode({ redirect })}`);
});

app.get('/user', (req, res) => {
    let token = req.cookies[cookie];
    let user = false;

    if (!token) {
        return res.json({ user });
    }

    try {
        user = jwt.verify(token, public, { algorithm: 'RS256' });
    } catch(err) {
        // Token didn't validate
    }

    res.json({ user });
});

app.get('/logout', (req, res) => {
    let redirect = req.query.redirect || req.get('Referrer') || "https://18xxdepot.com/";

    res.clearCookie(cookie, { domain: process.env.NODE_ENV === "production" ? "18xxdepot.com" : "localhost" });
    res.redirect(redirect);
});

app.get('/auth/slack', (req, res, next) => {
    let redirect = req.query.redirect || "https://18xxdepot.com/";

    passport.authorize('Slack', {
        state: redirect
    })(req, res, next);
});

app.get('/auth/slack/callback',
        passport.authenticate('Slack', { session: false, failureRedirect: '/login' }),
        (req, res) => {
            let user = req.user.user;
            let [first, ...rest] = user.name.split(" ");
            let last = rest.join(" ");

            let data = {
                iss: "18xxdepot.com",
                sub: user.email,
                slack: user,
                user_info: {
                    user_login: user.email,
                    user_name: user.name,
                    first_name: first,
                    last_name: last,
                    user_email: user.email,
                    user_roles: []
                }
            };

            let token = jwt.sign(data, private, { algorithm: 'RS256' });

            res.cookie(cookie, token, {
                domain: process.env.NODE_ENV === "production" ? "18xxdepot.com" : "localhost",
                maxAge: 86400000, // 1 day
                secure: process.env.NODE_ENV === "production"
            });

            res.redirect(req.query.state || "https://18xxdepot.com");
        });

app.listen(port);
