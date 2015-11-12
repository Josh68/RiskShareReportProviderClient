/*jshint sub: true*/
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:WatchFormDirective
 * @description
 * # WatchForm
 * Directive of the riskShareApp
 */

(function () {

  angular.module('riskShareApp')
    .directive('watchForm', ['$log', '$timeout', '$parse', watchFormDirective]);

  function watchFormDirective($log, $timeout, $parse) {
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs, ngModelCtrl) {
        var scopeExpression = $attrs.watchForm,
            invoker = $parse(scopeExpression),
            bindings = $attrs.watchFormBind ? $attrs.watchFormBind : 'keyup mouseup';
        $element.on(bindings, function(event){
          $timeout(function(){
            $scope.$apply(function() {
               invoker($scope, {
                  $event: event
               });
            });
          },0);
        });
      }
    };
  }

}());
