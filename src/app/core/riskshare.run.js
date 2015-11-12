'use strict';

/**
 * @ngdoc overview
 * @name riskShareAppRun
 * @description
 * # angularAppApp (original)
 *
 * Run block of the RiskShare application.
 */

(function () {

  angular
    .module('riskShareAppCore')
    .run(['RouteChangeSvc', runBlock]);

  function runBlock(RouteChangeSvc, ContentCacheSvc) {
    RouteChangeSvc.onstart();
    RouteChangeSvc.onsuccess();
  }

}());


