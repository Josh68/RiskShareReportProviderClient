/*jshint sub: true*/
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:WatchInputDirective
 * @description
 * # WatchInput
 * Directive of the riskShareApp
 */

(function () {

  angular.module('riskShareApp')
    .directive('watchInput', ['$log', '$timeout', '$parse', 'debounce', watchInputDirective]);

  //just watch inputs with this directive, optionally binding to the event specified in watchInputBind (probably blur)
  function watchInputDirective($log, $timeout, $parse, debounce) {
    return {
      restrict: 'A',
      require: ['ngModel', '?watchInputBind'],
      link: function($scope, $element, $attrs, ngModelCtrl) {
        var scopeExpression = $attrs.watchInput,
            invoker = $parse(scopeExpression),
            bindings = $attrs.watchInputBind ? $attrs.watchInputBind : 'keyup mouseup';

        $element.on(bindings, watchInputCallback);

        function watchInputCallback(event) {
          $timeout(function(){
            $scope.$apply(function() {
               invoker($scope, {
                  $event: event
               });
            });
          },0);
        }
      }

    };

  }

}());
