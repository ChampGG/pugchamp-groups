'use strict';

const _ = require('lodash');
const config = require('config');
const express = require('express');
const fs = require('fs');
const http = require('http');
const moment = require('moment');
const SteamID = require('steamid');

const GROUPS = config.get('groups');

var app = express();
var server = http.Server(app);

app.get('/:group', function(req, res) {
    if (!_.has(GROUPS, req.params.group)) {
        res.sendStatus(500);
        return;
    }

    let group = GROUPS[req.params.group];

    let steamID;

    try {
        steamID = new SteamID(req.query.user);
    }
    catch (err) {
        res.sendStatus(403);
        return;
    }

    let steam64 = steamID.getSteamID64();

    let matchingUsers = _.filter(group.users, ['user', steam64]);

    for (let user of matchingUsers) {
        if (_.has(user, 'expires') && moment().isAfter(user.expires)) {
            continue;
        }

        if (user.member) {
            res.sendStatus(200);
            return;
        }
        else {
            res.sendStatus(403);
            return;
        }
    }

    if (_.has(group, 'membershipDefault') && group.membershipDefault) {
        res.sendStatus(200);
    }
    else {
        res.sendStatus(403);
    }
});

try {
    fs.unlinkSync(config.get('server.listen'));
}
catch (err) {
    // ignore
}

server.listen(config.get('listen'));

try {
    fs.chmodSync(config.get('listen'), '775');
}
catch (err) {
    // ignore
}

process.on('exit', function() {
    server.close();
});
