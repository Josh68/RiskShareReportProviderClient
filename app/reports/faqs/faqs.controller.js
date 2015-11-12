'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:FaqCtrl
 * @description
 * # FAQ
 * Controller of the riskShareApp
 */

(function () {

  angular.module('riskShareAppReports').controller('FaqCtrl', FaqCtrl);

  FaqCtrl.$inject = ['DOC_URL', '$log'];

  function FaqCtrl(DOC_URL, $log) {
    var vm = this;
    vm.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    vm.docUrl = DOC_URL;
    $log.debug('DOC_URL is:: ' + DOC_URL);
  }

}());
