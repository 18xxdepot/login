const cookieParser = require('cookie-parser')
const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const qs = require('querystring');

const Slack = require('./slack');

const app = express();

const port = process.env.PORT || 3000;

const private = fs.readFileSync('./keys/login.pem');
const public = fs.readFileSync('./keys/login.public.pem');

const cookie = "jwt_token";

passport.use(new Slack());

app.disable('x-powered-by');
app.use(cookieParser())
app.use(passport.initialize());

app.get('/', (req, res) => {
    let redirect = req.query.redirect || req.get('Referrer') || "https://18xxdepot.com/";

    res.redirect(`/auth/slack?${qs.encode({ redirect })}`);
});

app.get('/headers', (req, res) => {
    res.json(req.headers);
});

app.get('/token', (req, res) => {
    let token = req.cookies[cookie];
    res.send(token);
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
            let data = {
                iss: "18xxdepot.com",
                sub: req.user.user.email,
                slack: req.user.user
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
