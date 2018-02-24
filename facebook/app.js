var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , FacebookStrategy = require('passport-facebook').Strategy
  , session = require('express-session')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , config = require('./configuration/config')
  , app = express();

var FB = require('fb');

// Passport session setup.
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// Use the FacebookStrategy within Passport.
passport.use(new FacebookStrategy({
  clientID: config.facebook_api_key,
  clientSecret: config.facebook_api_secret,
  callbackURL: config.callback_url
},
  function (accessToken, refreshToken, profile, done) {

    profile.accessToken = accessToken;
    console.log('profile.accessToken =', profile.accessToken);

    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat', key: 'sid' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

var getPageAccessToken = function (userId, user_access_token, callback) {
  FB.setAccessToken(user_access_token);
  FB.api(userId + '/accounts', 'get', { message: {} }, function (res) {
    if (!res || res.error) {
      console.log(!res ? 'error occurred' : res.error);
      return;
    }
    console.log('getPageAccessToken');
    console.log(res.data);
    callback(res.data);
  });
};

var postToPageWall = function (pageId, page_access_token, message, callback) {
  //set page_access_token as an active token
  FB.setAccessToken(page_access_token);

  //POST TO PAGE  WALL
  FB.api('', 'post', {
    batch: [
      { method: 'post', relative_url: pageId + '/feed', body: 'message=' + encodeURIComponent(message) }
    ]
  }, function (res) {
    var res0;

    if (!res || res.error) {
      console.log(!res ? 'error occurred' : res.error);
      return;
    }

    res0 = JSON.parse(res[0].body);

    console.log('postToPageWall');
    console.log(res0);

    if (res0.error) {
      console.log(res0.error);
    } else {
      console.log('Post Id: ' + res0.id);
    }

    callback(res0);
  });
};

app.get('/', function (req, res) {
  console.log(req.user);

  if (req.user == undefined) {
    res.render('index', { user: req.user });
    return;
  }

  if (req.user.accessToken == null) {
    res.render('index', { user: req.user });
    return;
  }

  var userId = 11111111111111111;
  var user_access_token = req.user.accessToken;

  getPageAccessToken(userId, user_access_token, function (page_access_tokens) {

    var pageId = 2222222222222222;
    var page_access_token = page_access_tokens[0].access_token;
    var message = 'Hi from facebook-node-js sdk #' + Math.floor(Math.random() * 100000);

    postToPageWall(pageId, page_access_token, message, function (result) {
      res.send(result);
    });
  });

});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['publish_actions', 'manage_pages', 'publish_pages'] }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  });


app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.listen(3000);