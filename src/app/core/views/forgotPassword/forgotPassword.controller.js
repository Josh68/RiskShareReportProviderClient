'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:ForgotPasswordCtrl
 * @description # ForgotPasswordCtrl Controller of the riskShareApp
 */

(function() {

  angular.module('riskShareApp').controller('ForgotPasswordCtrl', ForgotPasswordCtrl);

  ForgotPasswordCtrl.$inject = ['DataSvc', '$location', '$rootScope', '$scope', '$log', 'CONTENT'];

  /**
   * Controller responsible for reset password flow. This is a 3 step process. Username check, secret question check and reset password.
   * @param DataSvc Riskshare data access service.
   * @param $location Angular Service. 
   * @param $rootScope Angular Service.
   * @param $scope Angular Service.
   * @param $log Angular Service.
   */
  function ForgotPasswordCtrl(DataSvc, $location, $rootScope, $scope, $log, CONTENT) {
    var vm = this,
      queryParams = $location.search();
    vm.username = '';
    vm.question = '';
    vm.answer = '';
    vm.formSubmitted = false;
    vm.processFinished = false;
    vm.resetPassword = false;
    vm.resetPasswordFormId = CONTENT.userMgmt.resetPasswordFormId;
    vm.verifyPasswordFormId = CONTENT.userMgmt.verifyPasswordFormId;
    vm.token = '';
    /**
     * Data structure for password fields along with validation.
     */
    vm.passwordData = {
      newPass: {
        value: '',
        hasFocus: false,
        showRequired: function() {
          return $scope.forgotPassword.verifyUserForm.newPass.$dirty && $scope.forgotPassword.verifyUserForm.newPass.$error.required && !vm.passwordData.newPass.hasFocus ? true : false;
        },
        showInvalid: function() {
          return ($scope.forgotPassword.verifyUserForm.newPass.$dirty && !vm.passwordData.newPass.hasFocus) && ($scope.forgotPassword.verifyUserForm.newPass.$error.minlength || $scope.forgotPassword.verifyUserForm.newPass.$error.maxlength) ? true : false;
        }
      },
      verifyPass: {
        value: '',
        hasFocus: false,
        showRequired: function() {
          return $scope.forgotPassword.verifyUserForm.verifyPass.$dirty && !vm.passwordData.verifyPass.hasFocus && $scope.forgotPassword.verifyUserForm.verifyPass.$error.required ? true : false;
        },
        showInvalid: function() {
          return ($scope.forgotPassword.verifyUserForm.verifyPass.$dirty &&
              !vm.passwordData.verifyPass.hasFocus) &&
            ($scope.forgotPassword.verifyUserForm.verifyPass.$error.minlength || $scope.forgotPassword.verifyUserForm.verifyPass.$error.maxlength) ? true : false;
        },
        showMismatch: function() {
          return !vm.passwordData.verifyPass.hasFocus &&
            !vm.passwordData.newPass.hasFocus &&
            !$scope.forgotPassword.verifyUserForm.verifyPass.$error.required &&
            !$scope.forgotPassword.verifyUserForm.verifyPass.$error.minlength &&
            !$scope.forgotPassword.verifyUserForm.verifyPass.$error.maxlength &&
            $scope.forgotPassword.verifyUserForm.verifyPass.$error.validator &&
            $scope.forgotPassword.verifyUserForm.newPass.$valid &&
            !vm.passwordData.passwordsMatch ? true : false;
        }
      },
      passwordsMatch: false
    };

    var originalPasswordData = angular.copy(vm.passwordData);


    $scope.$watchCollection(function() {
      return [vm.passwordData.newPass.value, vm.passwordData.verifyPass.value];
    }, function(newVal, oldVal, scope) {
      if ((scope.forgotPassword.verifyUserForm.newPass.$modelValue === scope.forgotPassword.verifyUserForm.verifyPass.$modelValue) && scope.forgotPassword.verifyUserForm.newPass.$modelValue !== null && scope.forgotPassword.verifyUserForm.newPass.$valid) {
        vm.passwordData.passwordsMatch = true;
      } else {
        vm.passwordData.passwordsMatch = false;
      }

      if (angular.isUndefined(scope.forgotPassword.verifyUserForm.newPass.$modelValue) && scope.forgotPassword.verifyUserForm.newPass.$viewValue === '') {
        scope.forgotPassword.verifyUserForm.newPass.$setPristine();
      }
      if (angular.isUndefined(scope.forgotPassword.verifyUserForm.verifyPass.$modelValue) && scope.forgotPassword.verifyUserForm.verifyPass.$viewValue === '') {
        scope.forgotPassword.verifyUserForm.verifyPass.$setPristine();
      }
    });

    /**
     * Method used to verify the provided username with the API. If this step passes then go for secret question / answer. 
     */
    vm.verifyUser = function() {
      vm.formSubmitted = true;
      var dataObj = {
        username: vm.username
      };
      DataSvc.credentials.ByUsername.get(dataObj, function(response) {
        if (response.status === 'success') {
          vm.question = response.question;
          vm.username = response.username;
          if (vm.username && vm.question) {
            $location.url('/verifySecurity/forgotenPassword/?question=' + vm.question + '&username=' + vm.username);
            vm.processFinished = true;
          }
        }
        vm.formSubmitted = false;
      }, function(reason) {
        $log.error('Could not find the username:: ');
        $log.error(reason);
        vm.formSubmitted = false;
      });
    };

    /**
     * Utility method used to reset the fields from resetPassword form.
     */
    vm.resetPasswordForm = function() {
      vm.passwordData = angular.copy(originalPasswordData);
      $scope.forgotPassword.verifyUserForm.$setPristine();
    };

    /**
     * Submit method for reset password. This calls the API in order to reset the password after proper verification.
     */
    vm.submit = function() {
      vm.formSubmitted = true;
      var dataObj = {
        newPass: vm.passwordData.newPass.value,
        verifyPass: vm.passwordData.verifyPass.value,
        token: vm.token
      };
      DataSvc.credentials.ResetPassword.reset(dataObj, function(response) {
        if (response.status === 'success') {
          vm.processFinished = true;
          vm.resetPassword = false;
        }
      });
      vm.resetPasswordForm();
      vm.formSubmitted = false;
    };

    /**
     * This populates the model with values when the process is returning for the final 3rd step of reset password after a successful second step.
     */
    if (queryParams.token && typeof queryParams.token === 'string') {
      vm.token = queryParams.token;
      vm.resetPassword = true;
    }
  }
}());
