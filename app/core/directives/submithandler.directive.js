'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:submitHandler
 * @description
 * # submitHandler
 * Directive of the riskShareApp
 */

(function() {

  angular.module('riskShareApp').directive('submitHandler', ['$log', '$window', '$timeout', submitHandlerDirective]);

  /**
   * This simple directive is used on forms which have a data-ng-model attribute that acts as a switch in the form's datamodel, basically as a
   * declarative, but directive-based method for doing stuff on form submit. The initial value of the data-ng-model attribute can be defined
   * dynamically as the controller is loaded, referencing services, etc.
   */

  function submitHandlerDirective($log, $window, $timeout) {
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs) {

        var toggleBool = toggleBool || false;

        $element.on('submit', function(event) {
          var dataModel = event.target.getAttribute('data-ng-model'),
            dataModelVal = $scope,
            dataModelRef = '$scope';

          $log.debug('This is the dataModel on the element');
          $log.debug(dataModel);

          var decomposedDataModel = dataModel.split('.');

          angular.forEach(decomposedDataModel, function(value, key) { //get the name value pair from the ngModel of the element
            //$log.debug(dataModelVal);
            dataModelVal = dataModelVal[value];
            $log.debug(dataModelVal);
            dataModelRef += '.' + value;
          });

          //$log.debug('dataModelVal:');
          //$log.debug(dataModelVal);
          //$log.debug(dataModelRef);

          var dataModelRefBoolProp = dataModelRef + '.toggleBoolean';

          $scope.$apply(function() { //need to eval() here to take the string of the dataModel ref (the nested Object) and set it to a new value
            if (typeof(dataModelVal) === 'boolean') {
              eval(dataModelRef + '=' + !dataModelVal); //jshint ignore:line
            } else {
              eval(dataModelRefBoolProp + '=' + !toggleBool); //jshint ignore:line
              toggleBool = !toggleBool;
            }
          });

          //$log.debug($scope.rptView.viewResultsTable);
        });
      }
    };
  }

}());
