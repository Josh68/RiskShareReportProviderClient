/*jshint sub: true*/
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:masterCheckboxDirective
 * @description
 * # masterCheckbox
 * Directive of the riskShareApp
 */

(function () {

  angular.module('riskShareApp')
    .directive('masterCheckbox', ['$log', '$parse', masterCheckboxDirective]);

  function masterCheckboxDirective($log, $parse) {
    return {
      restrict: 'A',
      scope: {
        checked: '=ngChecked'
      },
      link: function($scope, $element, $attrs) {
        // $element.on('click', function(event){
        //   $log.info($scope.checked);
        //   $log.info($scope);
        //   $log.info(event);
        //   $log.info($element);
        // });        
        $scope.$watch(function(){
          return $scope.checked;
        }, function(newVal, oldVal, scope){
          if (!angular.equals(newVal, oldVal)) {
            var anchor = $element.find('a');
            if (newVal) {
              anchor.addClass('checked');
            } else {
              anchor.removeClass('checked');
            }
          }
        });        
      }
    };
  }

}());
