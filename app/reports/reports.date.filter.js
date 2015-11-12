/*jshint sub: true*/
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.filter:reportsMgmtDateFormatterFilter
 * @description
 * # reportsMgmtDateFormatter
 * Filter of the riskShareApp
 */

(function () {

  angular.module('riskShareApp')
    .filter('reportsMgmtDateFormat', ['$log', 'DateSvc', reportsMgmtDateFormatterFilter]);

  function reportsMgmtDateFormatterFilter($log, DateSvc) {
    return function(date) {
      var formattedDate = DateSvc.outputFriendlyYYYYMM(date);
      return formattedDate;
    };
  }

}());
