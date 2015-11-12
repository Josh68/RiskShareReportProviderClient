'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:alphaNum
 * @description
 * # alphaNum
 * Directive of the riskShareApp
 */

(function() {

  angular.module('riskShareApp').directive('alphaNum', ['$log', alphaNumDirective]);

  /**
   * Simple directive for checking if input is alphanumeric chars only
   **/

  function alphaNumDirective($log) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function($scope, $element, $attrs, ngModelCtrl) {
        var alphanumRegEx = /^\-?[A-Za-z0-9]+$/;
        ngModelCtrl.$setValidity('alphanum', true); //set the validity to true to start off, then evaluate the input to set appropriately on value change
        ngModelCtrl.$parsers.unshift(function(viewValue) {
          if (alphanumRegEx.test(viewValue)) {
            // it is valid
            ngModelCtrl.$setValidity('alphanum', true);
            return viewValue;
          } else {
            // it is invalid, return undefined (no model update)
            ngModelCtrl.$setValidity('alphanum', false);
            return undefined;
          }
        });
      }
    };
  }

}());
