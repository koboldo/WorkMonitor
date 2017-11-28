/* jshint node: true, esversion: 6  */
'use strict';
var fs = require('fs');
var path  = require('path');
var nodemailer = require('nodemailer');
var logger = require('./logger').getLogger('monitor');
var persons_db = require('./db/persons_db');

var conf;
try {
    conf = JSON.parse(fs.readFileSync(path.join(__dirname,'../conf.json'), 'utf8'));
} catch(err) {
    logger.error('Failed to load configuration. ',err.message);
    process.exit(1);
}

var mailer = {
    sendMail: function(req, res) {
        persons_db.read(req.params.id, function(err, personRow){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            let mailOpts = {
                from: conf.smtp.from,
                to: personRow.email, 
                subject: 'Hello ✔',
                text: 'Hello world?',
                html: '<b>Hello world?</b>'
            };

            let transporter = nodemailer.createTransport({
                
                    host: conf.smtp.host,
                    port: conf.smtp.port,
                    secure: conf.smtp.secure, 
                    auth: {
                        user: conf.smtp.username,
                        pass: conf.smtp.password
                    }    
                });
            
            transporter.sendMail(mailOpts, (err, info) => {
                if (err) {
                    logger.error(err);
                    res.status(500).json({status:'error', message: 'request processing failed'});
                    return;
                }

                logger.info('Message sent: ' + info.messageId);
                res.status(200).json({success: 1});
            });            

        });
    }
};

module.exports = mailer;