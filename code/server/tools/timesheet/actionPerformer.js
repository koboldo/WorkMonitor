/* jshint node: true, esversion: 6 */
'use strict';


const process = require('process');
const url = require('url');
const http = require('http');
const async = require('async');
const moment = require('moment');
const fs = require('fs');

let host = 'localhost:8080';
let files = ['logins.json','timesheets_2017.json','timesheets_2018.json'];


function sendRequest(method, address, payload, token, cb) {
    let _url = url.parse(address);
    let reqBody = (payload)?JSON.stringify(payload):'';

    let reqOptions = {
        hostname: _url.hostname,
        port    : _url.port,
        path    : _url.path,
        method  : method,
        headers : {} 
    };

    if(['POST','PUT'].indexOf(method) > -1)
        reqOptions.headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Content-Length': Buffer.byteLength(reqBody)
        };

    if(token) reqOptions.headers['x-access-token'] = token;

    let buffer = '';
    let status = 0;

    let postReq = http.request(reqOptions, function (resp) {
        // console.log('STATUS: ' + resp.statusCode);
        // console.log('HEADERS: ' + JSON.stringify(resp.headers));
        resp.setEncoding('utf8');
        status = parseInt(resp.statusCode);

        resp.on('data', function (chunk) {
            buffer = buffer + chunk;
        });
        resp.on('response', function(res) {
            console.log(res.statusCode);
        });

        resp.on('end',function(){
            if(status < 400) cb(null,buffer);
            else cb(buffer);
        });
    });
    
    postReq.on('error', function(e) {
        cb(e);
    });


    if(['POST','PUT'].indexOf(method) > -1)
        postReq.write(reqBody);

    postReq.end();
}

class Performer {
    constructor(host) {
        this.host = host;
        // this.actionFile = actionFile;
        this.actions = [];
        this.tokens = {};
        
        this.getTokenForRole = (role) => { 
            return this.tokens[role];
        };

        this.login = (role, arg, cb) => {
            console.log("calling login");
            let url = `http://${this.host}/login`;
            
            sendRequest('POST', url, arg, null, (err, resp)=>{
                if(err) cb(err);
                else {
                    this.tokens[role] = JSON.parse(resp).token;

                    let t = new Date(1970, 0, 1); // Epoch
                    t.setSeconds(JSON.parse(Buffer.from(JSON.parse(resp).token.split('.')[1], 'base64').toString()).exp);
                    console.log('TOKEN EXP:' + t.toISOString());
                    cb(null,resp);
                }
            });  
        };

        this.addTimesheet = (role, arg, cb) => {
            console.log("calling addTimesheet");
            let url = `http://${this.host}/api/v1/timesheets`;

            sendRequest('POST', url, arg, this.getTokenForRole(role), (err, resp)=>{
                if(err) cb(err);
                else cb();
            });            
        };

        this.addLeaveTimesheet = (role, arg, cb) => {
            console.log("calling addTimesheet");
            let url = `http://${this.host}/api/v1/timesheets/leave`;

            sendRequest('POST', url, arg, this.getTokenForRole(role), (err, resp)=>{
                if(err) cb(err);
                else cb();
            });            
        };

        this.createOrder = (role, arg, cb) => {
            console.log("calling createOrder");
            let url = `http://${this.host}/api/v1/orders`;

            sendRequest('POST', url, arg, this.getTokenForRole(role), (err, resp)=>{
                if(err) cb(err);
                else cb();
            });            
        };

        this.updateOrder = (role, arg, cb) => {
            console.log("calling updateOrder");
            let workNo = arg.workNo;
            delete arg.workNo;
            
            let url = `http://${this.host}/api/v1/orders/external/${workNo}`;
            sendRequest('PUT', url, arg, this.getTokenForRole(role), (err, resp)=>{
                if(err) cb(err);
                else cb();
            }); 
        };
        
        this.assignOrder = (role, arg, cb) => {
            console.log("calling assignOrder");
            let workNo = arg.workNo;
            let personId = arg.personId;
            let workId;
            
            let actionCalls = [];
            actionCalls.push((_cb)=>{
                let url = `http://${this.host}/api/v1/orders/external/${workNo}`;
                sendRequest('GET', url, null, this.getTokenForRole(role), (err, resp)=>{
                    if(err) _cb(err);
                    else {
                        let respObj = JSON.parse(resp);
                        workId = respObj.id;
                        if(!workId) _cb("not found");
                        else _cb();
                    }
                });
            });

            actionCalls.push((_cb)=>{
                let url = `http://${this.host}/api/v1/persons/${personId}/order/${workId}`;
                sendRequest('POST', url, {}, this.getTokenForRole(role), (err, resp)=>{
                    if(err) _cb(err);
                    else _cb();
                });
            });

            async.series(actionCalls,(err,result)=>{
                if(err) cb(err);
                else cb(null,result);
            });                 
        };

        this.findAction = (actionName) => {
            let action = Object.getOwnPropertyNames(this).filter((prop) => { return typeof this[prop] == 'function'; }).filter((func) => { return func == actionName });
            return action.length ? this[action[0]] : null;
        };

        this.loadActions = (actionFile) => {
            try {
                console.log('loading ' + actionFile);
                
                let data = fs.readFileSync(actionFile, 'utf8');
                this.actions.push(...JSON.parse(data));
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        };
    
        this.doActions = () => {
            
            let calls = [];
            this.actions.forEach((action)=>{
                if(action.date && !moment(action.date,'YYYY-MM-DD').isSame(moment(),'day')) {
                    return;
                } 
                console.log(JSON.stringify(action));
                
                let actionMethod = this.findAction(action.actionName);
                calls.push((_cb)=>{
                    actionMethod(action.role,action.arg,(err,rv)=>{
                        setTimeout(()=>{
                            if(err) _cb(err);
                            else _cb(null,rv);
                        },500);
                    });
                });
            }); 
            async.series(calls,(err,rv)=>{
                if(err) {
                    console.error(err);
                    process.exit(1);
                }
                // else console.log(JSON.stringify(rv));
				
                setTimeout(()=>{
                    console.log('.....');
                },3000);
            });
        };
    }
}


let performer = new Performer(host);

files.forEach((file)=>{ performer.loadActions(file); });

performer.doActions();

