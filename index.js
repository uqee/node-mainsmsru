'use strict';
var API_KEY = undefined, URL_BASE = 'http://mainsms.ru/api/mainsms',
    crypto = require('crypto'),
    http = require('http');

// tools, mainsms.ru/home/api

  function getUrlParams (options) {
    var signature = '', params = '',
        keys = Object.keys(options).sort(),
        i, imax = keys.length, key, value;

    for (i = 0; i < imax; i++) {
      key = keys[i];
      value = options[key];
      if (value || value === '' || value === 0) {
        signature += value + ';';
        params += key + '=' + value + '&';
      }
    }

    signature += API_KEY;
    signature = crypto.createHash('sha1').update(signature).digest('hex');
    signature = crypto.createHash('md5').update(signature).digest('hex');

    params += 'sign=' + signature;
    return params;
  }

// message, mainsms.ru/home/mainapi

  var message = (function () {
    var URL_GROUP = URL_BASE + '/message';
    return {
      
      send: function (options, callback) {

        // allow array of recipients
        if (options.recipients instanceof Array) options.recipients = options.recipients.join(',');

        // request string
        var url = URL_GROUP + '/send?' + getUrlParams(options);

        //
        http
          .get(url, function (res) {
            var body = '';

            // http error
            if (res.statusCode !== 200)
              callback({
                code: res.statusCode,
                message: 'HTTP ERROR: bad response code'
              });

            // http ok
            else {
              res.on('data', function (chunk) { body += chunk; });
              res.on('end', function () {

                // parse response
                body = JSON.parse(body);

                // mainsms ok
                if (body.status === 'success') {
                  delete body.status;
                  callback(null, body);
                }

                // mainsms error
                else if (body.status === 'error')
                  callback({
                    code: body.error,
                    message: body.message
                  });

                // mainsms unknown error
                else callback({
                  code: 0,
                  message: 'unknown error'
                });
              });
            }
          })
          .on('error', function (err) { callback(err.message); });
      },

      status: null,
      price: null,
      balance: null,
      info: null
    };
  })();

// export

  module.exports = function (key) {

    // fail
    if (!key) {
      console.log('node-mainsmsru: api key required');
      return null;
    }

    // ok
    else {
      API_KEY = key;
      return {
        message: message,
        sending: null,
        batch: null,
        group: null,
        contact: null,
        sender: null
      };
    }
  };
