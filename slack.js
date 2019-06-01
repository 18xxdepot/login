const OAuth2Strategy = require('passport-oauth2').Strategy;

class Slack extends OAuth2Strategy {
    constructor () {
        let options = {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            tokenURL: "https://cardboardklatch.slack.com/api/oauth.access",
            authorizationURL: "https://cardboardklatch.slack.com/oauth/authorize",
            scope: ['users:read', 'users:read.email'],
            callbackURL: process.env.NODE_ENV === "production" ? "https://login.18xxdepot.com/auth/slack/callback" : "http://localhost:3000/auth/slack/callback",
        };
        // ['identity.basic', 'identity.email', 'identity.avatar', 'identity.team']

        super(options, (at, rt, profile, done) => done(null, profile));

        this.profileUrl = "https://slack.com/api/users.info?token=";
        this.name = 'Slack';
    }

    userProfile (accessToken, done) {
        this.get(this.profileUrl + accessToken, function (err, body, res) {
            if (err) {
                return done(err);
            } else {
                try {
                    var profile = JSON.parse(body);

                    if (!profile.ok) {
                        done(body);
                    } else {
                        delete profile.ok;

                        profile.provider = 'Slack';
                        profile.id = profile.user.id;
                        profile.displayName = profile.user.name;

                        done(null, profile);
                    }
                } catch(e) {
                    done(e);
                }
            }
        });
    }

    get (url, callback) {
        this._oauth2._request("GET", url, {}, "", "", callback );
    }

    authorizationParams (options) {
        return {
            team: "cardboardklatch"
        };
    }
}

module.exports = Slack;
