'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:ErrorCtrl
 * @description
 * # Error
 * Controller of the riskShareApp
 */

(function () {

  angular.module('riskShareApp').controller('ErrorCtrl', ErrorCtrl);

  function ErrorCtrl() {
    var vm = this;
    vm.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  }

}());
