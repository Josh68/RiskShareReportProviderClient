'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:MessagesCtrl
 * @description
 * # Messages
 * Controller of the riskShareApp
 */

(function () {

  angular
    .module('riskShareAppLayout')
    .controller('MessagesCtrl', MessagesCtrl);

  MessagesCtrl.$inject = ['$rootScope', '$scope', '$timeout', 'AuthenticationSvc', 'MessagesSvc'];

  function MessagesCtrl($rootScope, $scope, $timeout, AuthenticationSvc, MessagesSvc) {
    var vm = this;
    vm.appName = 'Provider Reports';
    vm.pageTitle = $rootScope.pageTitle;
    vm.testVal = 'Test value for HeaderCtrl';
    vm.isLoggedIn = AuthenticationSvc.getIsLoggedIn();
    vm.errorMessages = [];
    vm.infoMessages = [];
    vm.serviceAlert = '';
    vm.hasServiceAlert = false;
    vm.hasErrorMessages = false;
    vm.hasInfoMessages = false;

    $rootScope.$on('messagesUpdate', function(){
      vm.errorMessages = MessagesSvc.getErrors();

      vm.hasErrorMessages = vm.errorMessages.length > 0 && vm.errorMessages[0] !== '';
      if (!vm.hasErrorMessages && !$scope.$$phase) { //don't run digest unless we're clearing errors
        $scope.$digest();
      }

      angular.forEach(vm.errorMessages, function(value, key){
        if (value) {
          if (angular.isString(value)) {
            var errorString = value.toLowerCase();
            if (errorString.indexOf('services') > -1) { //TODO - we should agree on a code for this, if we haven't, and I should be inspecting that somewhere instead of the message content
              vm.serviceAlert = value;
              vm.hasServiceAlert = true;
              if (vm.errorMessages.length === 1) { //this is the only error, and it's a service alert
                vm.hasErrorMessages = false; //avoid duplicating this error
              }
            }
          }
        }
      });

      vm.infoMessages = MessagesSvc.getInfoMsg();
      vm.hasInfoMessages = vm.infoMessages.length > 0 && vm.infoMessages[0] !== '';
      if (!vm.hasinfoMessages && !$scope.$$phase) { //don't run digest unless we're clearing errors
        $scope.$digest();
      }
    });

    $rootScope.$on('serviceAlert', function(){
      $timeout(function(){ //delay this to wait for errorMessages to be populated
        vm.errorMessages = vm.errorMessages.length > 0 ? vm.errorMessages : MessagesSvc.getErrors();
        angular.forEach(vm.errorMessages, function(value, key){
          if (value) {
            if (angular.isString(value)) {
              //var errorString = value.toLowerCase();
              //if (errorString.indexOf('services') > -1) { //TODO - we should agree on a code for this, if we haven't, and I should be inspecting that somewhere instead of the message content
                vm.serviceAlert = value;
                vm.hasServiceAlert = true;
                if (vm.errorMessages.length === 1) { //this should be the only error, and it's a service alert
                  vm.hasErrorMessages = false; //avoid duplicating the service alert error
                }
              //}
            }
          }
        });
      }, 0);
    });
    
  }

}());
