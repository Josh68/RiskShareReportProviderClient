/*jshint sub: true*/
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:PreventDefaultDirective
 * @description
 * # PreventDefault
 * Directive of the riskShareApp
 */

(function () {

  angular.module('riskShareApp')
    .directive('preventDefault', ['$log', '$parse', preventDefaultDirective]);

  function preventDefaultDirective($log, $parse) {
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs) {
        $log.debug('$attrs.preventDefault is:: ' + $attrs.preventDefault);
        $log.debug($attrs.preventDefault);
        $log.debug('preventDefault evaluates to:: ' + $parse($attrs.preventDefault)($scope));

        $scope.$watch(function(){
          return $parse($attrs.preventDefault)($scope);
        }, function(newVal, oldVal){
          $log.debug('preventDefault oldValue:: ' + oldVal);
          $log.debug('preventDefault newValue:: ' + newVal);
          if(!angular.equals(oldVal, newVal)) {
            if($parse($attrs.preventDefault)($scope)){
              $element.addClass('disabled'); //see if this screws things up too much
              $element.on('click', function(event) {
                  event.preventDefault();
              });
            } else {
              $element.removeClass('disabled'); //see if this screws things up too much
              $element.off('click');
            }
          }
        });
      }
    };
  }

}());
