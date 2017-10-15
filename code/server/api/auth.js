'use strict';

var jwt = require('jsonwebtoken');
var sha1 = require('sha1');
var util = require('util');
var fs = require('fs');
var path  = require('path');

var dbUtil = require('./db/db_util');

var logger = require('./logger').getLogger('monitor'); 

var authQuery = 'select LOGIN, IS_ACTIVE, ROLE_CODE from PERSON where LOGIN = ? and PASSWORD = ?';

var secret;

try {
    secret = fs.readFileSync(path.join(__dirname,'../secret'), 'utf8');
    if(logger.isDebugEnabled()) logger.debug('secret has been read');
} catch(err) {
    logger.error('Failed to load secret. ', err.message);
    process.exit(1);
}

var auth = {
    
    authenticate: function(req, res) {
        var user = req.body.username;
        var passwd = req.body.password;
        if(logger.isDebugEnabled()) logger.debug('username: ' + user);
        if(logger.isDebugEnabled()) logger.debug('password: ' + passwd);
        var passwdSha1 = sha1(passwd);
        
        var db = dbUtil.getDatabase();
        var authStat = db.prepare(authQuery).bind([user, passwdSha1]).get(function(err,userRow) {
            authStat.finalize();
            db.close();
            
            if(err) {
                return res.status(400).json({ 
                                    sucess: false,
                                    message: err.message});
            }
            
            if(userRow == null) {
                return res.status(403).json({
                                success: false,
                                message: "authetication failed"
                                });
            }
            if(userRow.IS_ACTIVE == "N") {
                return res.status(403).json({
                                success: false,
                                message: "user locked"
                                });
            }
            if(userRow.IS_ACTIVE == "Y") {
                var token = jwt.sign(
                                {user:user, role: userRow.ROLE_CODE},
                                secret,
                                { expiresIn: 60 * 10 });
                if(logger.isDebugEnabled()) logger.debug('authentication token ' + token);
                res.json({token: token});
            }
        });
        
        

    },
    
    validateToken: function(req, res, next) {
        logger.info('validating ' + req.path);
        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        
        if(token) {
            if(logger.isDebugEnabled()) logger.debug('token found in request: ' + token);
            
            try {
                var decoded = jwt.verify(token, secret);
                if(logger.isDebugEnabled()) logger.debug('decoded token data: ' + util.inspect(decoded));

            } catch(err) {
                logger.error(err);
                return res.status(403).json({
                                success: false,
                                message: err.message
                                });
            }
            next();
        } else {
            logger.error('token not found');
            res.status(403).json({
                                success: false,
                                message: "token not found"
                                });
        }
    }
};

module.exports = auth;