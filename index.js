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
        if (key == 'message') {
          params += key + '=' + encodeURI(value) + '&';
        } else {
          params += key + '=' + value + '&';
        }
      }
    }

    signature += API_KEY;
    signature = crypto.createHash('sha1').update(signature).digest('hex');
    signature = crypto.createHash('md5').update(signature).digest('hex');

    params += 'sign=' + signature;
    return params;
  }

  function sendRequest (url_base, options, callback) {
    var url = url_base + '?' + getUrlParams(options);
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
              message: 'MAINSMS ERROR: unknown error'
            });
          });
        }
      })

      // request error
      .on('error', function (err) {
        callback({
          code: -1,
          message: 'REQUEST ERROR: ' + err.message
        });
      });
  }

// message, mainsms.ru/home/mainapi

  var message = (function () {
    var URL_GROUP = URL_BASE + '/message';
    return {

      send: function (options, callback) {

        // allow array of recipients
        if (options.recipients instanceof Array) options.recipients = options.recipients.join(',');

        //
        sendRequest(URL_GROUP + '/send', options, callback);
      },

      status: function (options, callback) {

        // allow array of messages_id
        if (options.messages_id instanceof Array) options.messages_id = options.messages_id.join(',');

        //
        sendRequest(URL_GROUP + '/status', options, callback);
      },

      price: function (options, callback) {

        // allow array of recipients
        if (options.recipients instanceof Array) options.recipients = options.recipients.join(',');

        //
        sendRequest(URL_GROUP + '/price', options, callback);
      },

      balance: function (options, callback) {
        sendRequest(URL_GROUP + '/balance', options, callback);
      },

      info: function (options, callback) {

        // allow array of phones
        if (options.phones instanceof Array) options.phones = options.phones.join(',');

        //
        sendRequest(URL_GROUP + '/info', options, callback);
      }
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
