'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:NotFoundCtrl
 * @description
 * # NotFound
 * Controller of the riskShareApp
 */

(function () {

  angular.module('riskShareApp').controller('NotFoundCtrl', [NotFoundCtrl]);

  function NotFoundCtrl() {
    var vm = this;
    vm.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  }

}());
