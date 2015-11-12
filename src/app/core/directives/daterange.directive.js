/*jshint sub: true*/
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:DateRange
 * @description
 * # DateRange
 * Directive of the riskShareApp
 */

(function() {

  angular.module('riskShareApp')
    .directive('inputDateRange', ['$log', '$window', '$timeout', inputDateRangeDirective])
    //.directive('withDateRange', ['$log', '$window', withDateRangeDirective])
    .directive('dateRangeRepeater', ['$log', '$window', dateRangeRepeaterDirective]);

  // function withDateRangeDirective($log, $window) {
  //   return {
  //     restrict: 'AC',
  //     scope: {
  //       model: '=rangeForm'
  //     },
  //     link: function($scope, $element, $attrs, ngModelCtrl) {
  //       //nothing
  //     },
  //     controller: ['$scope', function($scope) {
  //       this.getModel = function() {
  //         return $scope.model;
  //       };
  //     }]
  //   };
  // }

  var dateRangeArray = [];

  function dateRangeRepeaterDirective($log, $window) {
    return {
      restrict: 'AC',
      scope: {
        model: '=ngForm' //this is the nested form of the repeater, an ngForm directive
      },
      link: function($scope, $element, $attrs, ngModelCtrl) {
        //nothing
        // $log.debug($scope.$parent);
        // $log.debug('dateRangeArray inside repeater');
        // $log.debug(dateRangeArray);
      },
      controller: ['$scope', function($scope) {
        this.getModel = function() {
          return $scope.model; //here we pass the ngForm modelCtrl to the inputs, which call this method on the ngForm controller
        };
      }]
    };
  }

  function inputDateRangeDirective($log, $window, $timeout) {
    var parentModelCtrlIterator = 1,
        rangeIterator = 0;

    return {
      require: ['ngModel', '^dateRangeRepeater'],
      restrict: 'AC',
      link: function($scope, $element, $attrs, ngModelCtrl) {
        $timeout(function() {
          var moment = $window.moment,
            newDateFormat = $attrs.modaDateFormat,
            originalDateFormat = $attrs.originalDateFormat,
            parentModelCtrl = ngModelCtrl[1].getModel(),
            parentModelCtrlName = parentModelCtrl.$name,
            thisModelCtrl = ngModelCtrl[0],
            ngModelName = $attrs.ngModel,
            ngModelPrefix = ngModelName.substring(0, ngModelName.indexOf('.'));

          parentModelCtrl.$setValidity('childInput', true);

          // parentModelCtrlIterator++;
          // if (parentModelCtrlIterator % 2 === 0) {
          //   rangeIterator++;
          //   dateRangeArray[rangeIterator] = [];
          // }

          // $log.debug($scope);
          // $log.debug($element);
          // $log.debug($attrs);
          // $log.debug(thisModelCtrl);
          // $log.debug(parentModelCtrl);
          
          // angular.forEach(parentModelCtrl, function(propVal, propName) {
          //   // if (angular.equals(propVal, thisModelCtrl)) {
          //   //   $log.debug('this is the model of the current date range on the parent:: ' + propName);
          //   // }
          //   // if (propName.toLowerCase().indexOf('date') > -1) {
          //   //   $log.debug('this is a date input from the parent:: ' + propName);
          //   // }
          //   if ($attrs.name === propName) {
          //     $log.debug('this is a date input from the parent, range # ' + rangeIterator + ':: ' + propName);
          //     var propValCopy = angular.copy(propVal);
          //     $log.debug(propName + ' ' + propValCopy.$modelValue);
          //     dateRangeArray[rangeIterator].push(propValCopy);
          //   }
          // });

          // $log.debug('dateRangeArray:: ');
          // $log.debug(dateRangeArray);

          $scope.$watch(function() {
            return $scope[ngModelPrefix].showInvalid;
          }, function(newVal, oldVal, scope){
            if (newVal) {
              var thisWatchedDateRangeObj = $scope[ngModelPrefix];
              // $log.debug('thisWatchedDateRangeObj:: ');
              // $log.debug(thisWatchedDateRangeObj);
              // $log.debug(scope);
              parentModelCtrl.$setValidity('childInput', false);
              return;
            } else {
              parentModelCtrl.$setValidity('childInput', true);
            }
          });

        }, 0);
      }
    };
  }

}());
