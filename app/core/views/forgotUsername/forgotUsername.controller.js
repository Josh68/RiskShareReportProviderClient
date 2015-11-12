'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:ForgotUsernameCtrl
 * @description # ForgotUsernameCtrl Controller of the riskShareApp
 */

(function() {

  angular.module('riskShareApp').controller('ForgotUsernameCtrl', ForgotUsernameCtrl);

  ForgotUsernameCtrl.$inject = ['DataSvc', '$location', '$rootScope', '$scope', '$log', 'CONTENT'];

  /**
   * Forgot username controller. Is responsible for verifying user information through the API. 
   * If this is successfully done, it will go to the next step verification for secret question/ answer.
   * 
   * @param DataSvc Riskshare data access service.
   * @param $location Angular service.
   * @param $rootScope Angular service.
   * @param $scope Angular service.
   * @param $log Angular service.
   */
  function ForgotUsernameCtrl(DataSvc, $location, $rootScope, $scope, $log, CONTENT) {
    var vm = this;

    vm.firstName = '';
    vm.lastName = '';
    vm.email = '';
    vm.question = '';
    vm.formSubmitted = false;
    vm.missingInformation = false;
    vm.forgotUsernameFormId = CONTENT.userMgmt.forgotUsernameFormId;

    vm.verifyUser = function() {
      vm.formSubmitted = true;

      var verifyUserObj = {
        'firstName': vm.firstName,
        'lastName': vm.lastName,
        'email': vm.email
      };

      DataSvc
        .request('POST', 'forgotUsername', verifyUserObj)
        .then(
          function(response) {
            $log.debug('AuthenticationSvc.verifyUser response is:: ');
            $log.debug(response);
            vm.formSubmitted = false;
            if (response.status === 200 && response.data.status === 'success') {
              vm.question = response.data.question;
              if (vm.email && vm.question) {
                $location.url('/verifySecurity/forgotenUsername/?question=' + vm.question + '&email=' + vm.email);
              } else {
                vm.missingInformation = true;
              }
            }
          },
          function(reason) {
            vm.formSubmitted = false;
            $log.error('Problem occured while verifying user information: ');
            $log.error(reason);
          });
    };
  }

}());
