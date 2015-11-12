'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:Utils
 * @description
 * # Utils
 * Service of the riskShareApp
 */

//All the global stuff that need to happen on route change start and success

(function() {

  angular
    .module('services.core.Utils', [])
    .factory('UtilsSvc', UtilsSvc);

  UtilsSvc.$inject = ['$log'];

  function UtilsSvc($log) {

    var service = {
      deDupe: deDupe,
      diff: diff,
      isEmpty: isEmpty,
      stringifyObjData: stringifyObjData,
      toTitleCase: toTitleCase
    };

    return service;

    ////////////

    function deDupe(arr) {
      var i,
        len = arr.length,
        out = [],
        obj = {};
      for (i = 0; i < len; i++) {
        obj[arr[i]] = 0; //overwrite dupes here;
      }
      for (var prop in obj) {
        out.push(prop); //return deduped to new array
      }
      return out;
    }

    function diff(a, b) {
      var returnObj = {};
      angular.forEach(a, function(value, key) {
        if (b[key] === value) {
          return;
        }
        returnObj[key] = angular.isObject(value) ? diff(value, b[key]) : value;
      });
      return returnObj;
    }

    function isEmpty(obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
    }

    function stringifyObjData(obj) {
      var returnObj = {};
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (typeof obj[prop] === 'boolean' || typeof obj[prop] === 'number') {
            $log.debug(prop);
            $log.debug(obj[prop]);
            returnObj[prop] = obj[prop].toString();
          } else {
            returnObj[prop] = obj[prop];
          }
        }
      }
      return returnObj;
    }

    function toTitleCase(str) {
      return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

  }

}());
