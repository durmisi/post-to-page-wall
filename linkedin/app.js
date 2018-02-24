const express = require('express');
const app = express();

var scope = ['rw_company_admin'];
var linkedinAuthMgr = require('node-linkedin')('app-id', 'app-secret');
var linkedin = null;
var companyId = 2414183; //this is a TEST Linkedin company
var companyUrl = "https://www.linkedin.com/company/devtestco";

app.get('/', (req, res) => {

    if (linkedin == null)
        return res.redirect('/oauth/linkedin');

    // linkedin.companies_search.name('facebook', 1, function(err, company) {
    //     res.send(company.companies.values[0])
    // });

    // linkedin.companies.company(companyId, function(err, company) {
    //     console.log('linkedin.companies.company');
    //     console.log(company);
    //     res.send(company)
    // });

    linkedin.companies.updates(companyId, function (err, updates) {
        var newPostUrl = req.protocol + '://' + req.headers.host + '/share';
        res.send('Total: '+ updates._total + ' updates. <a href="'+ newPostUrl +'">Click here to create a post on your company wall. </a>');
    });
});

//This is a test handler, just to demonstrate share-ing content to the company page
app.get('/share', (req, res) => {
    linkedin.companies.share(companyId, {
        "comment": "QNR - Check out the LinkedIn Pages Share API!",
        "content": {
            "title": "LinkedIn Developers Documentation On Using the Share API ",
            "description": " Leverage the Share API to maximize engagement on user-generated content on LinkedIn",
            "submitted-url": " https://developer.linkedin.com/docs/company-pages ",
            "submitted-image-url": " https://m3.licdn.com/media/p/3/000/124/1a6/089a29a.png"
        },
        "visibility": { "code": "anyone" }
    }, function (err, share) {
        if (err)
            return console.error(err);
       // res.send(share)
        res.send('<a href="'+ companyUrl +'">Click here to view your post on your company wall.</a>');
    });
});

// Using a library like `expressjs` the module will 
// redirect for you simply by passing `res`. 
app.get('/oauth/linkedin', function (req, res) {
    // set the callback url
    linkedinAuthMgr.setCallback(req.protocol + '://' + req.headers.host + '/oauth/linkedin/callback');
    linkedinAuthMgr.auth.authorize(res, scope);
});

// Again, `res` is optional, you could pass `code` as the first parameter 
app.get('/oauth/linkedin/callback', function (req, res) {
    linkedinAuthMgr.auth.getAccessToken(res, req.query.code, req.query.state, function (err, result) {
        if (err)
            return console.error(err);

        /**
         * Results have something like:
         * {"expires_in":5184000,"access_token":". . . ."}
         */

        console.log(result);

        linkedin = linkedinAuthMgr.init(result.access_token, {
            timeout: 10000 /* 10 seconds */
        });

        return res.redirect('/');
    });
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));