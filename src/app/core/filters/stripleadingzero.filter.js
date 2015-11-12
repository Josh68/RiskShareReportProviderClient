/*jshint sub: true*/
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.filter:stripLeadingZero
 * @description
 * # stripLeadingZero
 * Filter of the riskShareApp
 */

(function () {

  angular.module('riskShareApp')
    .filter('stripleadingzero', ['$log', stripLeadingZeroFilter]);

  function stripLeadingZeroFilter($log) {
    return function(input) {
      if (input.charAt(0) === '0') {
        return input.slice(1);
      }
    };
  }

}());
