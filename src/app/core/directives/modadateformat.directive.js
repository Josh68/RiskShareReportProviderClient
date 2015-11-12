/*jshint sub: true*/
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:ModaDateFormat
 * @description
 * # ModaDateFormat
 * Directive of the riskShareApp
 */

(function() {

  angular.module('riskShareApp')
    .directive('modaDateFormat', ['$log', '$window', '$timeout', modaDateFormatDirective]);

  //basic attempt at a formatter and parser for Moda date formats. Unfortunately, broken by angular-ui-mask which automatically asserts itself as the last parser and strips dashes from dates on the model (which is what we want for ISO-8601). The re-conversion is being done in controllers (TIN controller, so far). Stinks, but is all I could come up with at the time.
  function modaDateFormatDirective($log, $window, $timeout) {
    return {
      require: 'ngModel',
      restrict: 'A',
      scope: {
        originalDateFormat: '@',
        setInvalid: '&'
      },
      link: function($scope, $element, $attrs, ngModelCtrl) {
        var moment = $window.moment,
            newDateFormat = $attrs.modaDateFormat,
            originalDateFormat = $attrs.originalDateFormat;

        // This code (pretty much all of it) was copped online and the block below seems to be for a dynamic formatter. We have a static formatter and really don't want to muck with formats more than we already are doing, so commenting out
        // $attrs.$observe('modaDateFormat', function(newValue) {
        //   if (newDateFormat === newValue || !ngModelCtrl.$modelValue) {
        //     return;
        //   }
        //   newDateFormat = newValue;
        //   ngModelCtrl.$modelValue = new Date(ngModelCtrl.$setViewValue);
        // });

        ngModelCtrl.$formatters.unshift(function(modelValue) {
          if (modelValue.indexOf('/') > -1 && modelValue.length === 10) {
            var regex = /\//g;
            modelValue = modelValue.replace(regex, '');
            modelValue = modelValue.substr(0, 4) + '-' + modelValue.substr(4, 2) + '-' + modelValue.substr(6);
          }
          //$scope = $scope;
          if (!newDateFormat || !modelValue) {
            return '';
          }
          var retVal = moment(modelValue).format(newDateFormat);
          return retVal;
        });

        ngModelCtrl.$parsers.unshift(function(viewValue) {
          var underscore = /_/,
              returnDate = '';
          //$scope = $scope;
          if (viewValue.length > 10) { //with the mask, this should only happen if there's a trailing underscore left by the mask (with a full date, which has 10 characters, including slashes, so index 10 is char 11
            viewValue = viewValue.slice(0, -1);
          }
          //viewValue.replace(underscore, ' ');
          var dateToCheck = moment(viewValue);
          $log.debug(dateToCheck);
          $log.debug(dateToCheck.isValid());
          if (dateToCheck && dateToCheck.isValid()) {
            returnDate = dateToCheck.format(originalDateFormat);
          }
          // if ( returnDate.charAt(0) === '0' ) { //junk dates that are probably missing the last digit
          //   returnDate = '';
          // }
          $log.debug('$parsers return date should be:: ' + returnDate);
          if (returnDate.length < 10) { //trigger a function in the controller that can set invalid state
            $scope.setInvalid();
          }
          //ngModelCtrl.$modelValue = returnDate;
          //ngModelCtrl.$setViewValue(viewValue);
          return returnDate;
        });
        
        // no solution so far to prevent ui-mask from reformatting the model to omit dashes (otherwise, date order is correct, with YYYYMMDD)
        // trying to reset the model value breaks functionality

      }
    };
  }

}());
