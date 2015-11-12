'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:SecurityCtrl
 * @description
 * # SecurityCtrl
 * Controller of the riskShareApp
 */

(function() {

  angular
    .module('riskShareApp')
    .controller('SecurityCtrl', SecurityCtrl);

  SecurityCtrl.$inject = ['AuthenticationSvc', 'UserSvc', 'MessagesSvc', '$location', '$rootScope', '$scope', '$log', 'CONTENT'];

  function SecurityCtrl(AuthenticationSvc, UserSvc, MessagesSvc, $location, $rootScope, $scope, $log, CONTENT) {
    var vm = this;
    vm.question = '';
    vm.answer = '';
    vm.formSubmitted = false;
    vm.securityFormId = CONTENT.userMgmt.securityFormId;
    vm.disabledSubmitBool = false; //placeholder for the disabled class on the submit button

    vm.disableSubmit = function() { //triggered every time the view checks what ng-disabled should be on the submit button
      var returnVal = false;
      if (!angular.isUndefined($scope.changeQuestionForm)) {
        if (!angular.isUndefined($scope.changeQuestionForm.answer) && !angular.isUndefined($scope.changeQuestionForm.question)) {
          var questionEmpty = !$scope.changeQuestionForm.question.$viewValue || $scope.changeQuestionForm.question.$viewValue === '',
              answerEmpty = !$scope.changeQuestionForm.answer.$viewValue || $scope.changeQuestionForm.answer.$viewValue === '';
          returnVal = (vm.formSubmitted || questionEmpty || answerEmpty) ? true : false;
        }
      }
      vm.disabledSubmitBool = returnVal; //set this to the returnVal of the function to avoid calling the function more times than necessary (in order to set both the submit button's disabled attribute and class = this would best be extended to a directive, but just a one-off on this page, instead)
      return returnVal;
    };
    
    vm.changeQuestion = function() {
      //$log.debug('hit SecurityCtrl fn');
      vm.formSubmitted = true;
      AuthenticationSvc.updateSecurityQuestion(vm.question, vm.answer).then(function(response) {
        $log.debug('AuthenticationSvc.updateSecurityQuestion response is:: ');
        $log.debug(response);
        vm.formSubmitted = false;
        //TODO - any need to handle a success here with an error message?
        if (response.status === 200 && response.data.status === 'success') {
          UserSvc.setUserKey('securityQASet', 'true');
          UserSvc.routeToHome();
        }
      }, function(reason) {
        vm.formSubmitted = false;
        $log.error('Problem setting security Q & A: ');
        $log.error(reason);
      });
    };
  }

}());
