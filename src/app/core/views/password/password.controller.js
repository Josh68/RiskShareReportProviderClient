'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:PasswordCtrl
 * @description
 * # ChangepasswordCtrl
 * Controller of the riskShareApp
 */

(function () {

  angular
    .module('riskShareApp')
    .controller('PasswordCtrl', PasswordCtrl);

PasswordCtrl.$inject = ['AuthenticationSvc', 'UserSvc', 'usSpinnerService', 'MessagesSvc', 'ValidationSvc', '$location', '$rootScope', '$scope', '$log', 'ROLE_CLASSES', 'CONTENT'];

function PasswordCtrl(AuthenticationSvc, UserSvc, usSpinnerService, MessagesSvc, ValidationSvc, $location, $rootScope, $scope, $log, ROLE_CLASSES, CONTENT) {
  var vm = this,
      passwordCheckPassed = false,
      newPassDirty = false,
      newPassValid = false,
      newPassModelVal = '',
      newPassEmpty =  true,
      newPassEmptyOrPristine = true,
      verifyPassDirty = false,
      verifyPassValid = false,
      verifyPassModelVal = '',
      verifyPassEmpty = true,
      verifyPassEmptyOrPristine = false,
      verifyPassValidLength = false,
      newPassValidLength = false,
      
      passwordsMatch = false;

  vm.passwordFormId = CONTENT.userMgmt.passwordFormId;

  vm.passwordData = {
    oldPass: {
      value: '',
      hasFocus: false,
      showRequired: false,
      checkValidity: function() {
        if ($scope.passwordForm.oldPass.$dirty && !$scope.passwordForm.oldPass.hasFocus) {
          vm.passwordData.oldPass.showRequired = $scope.passwordForm.oldPass.$error.required;
        }
      },
      hideErrors: function() {
        if ($scope.passwordForm.oldPass.$dirty) {
          if ($scope.passwordForm.oldPass.$error.required) {
            return false;
          } else {
            //vm.passwordData.oldPass.showRequired = false;
            return true;
          } 
        }
      }
    },
    newPass: {
      value: '',
      hasFocus: false,
      showRequired: false,
      showInvalid: false,
      checkValidity: function(e) {
        updatePasswordValues(e);
      },
      hideErrors: function() {
        updatePasswordValues();
        var returnValid = ((verifyPassDirty && verifyPassValid && passwordsMatch) || newPassValidLength);
        if (newPassDirty) {
          return returnValid;
        } else {
          return true;
        }
      }
    },
    verifyPass: {
      value: '',
      hasFocus: false,
      showRequired: false,
      showInvalid: false,
      showMismatch: false,
      checkValidity: function(e) {
        updatePasswordValues(e);
      },
      hideErrors: function() {
        updatePasswordValues();
        var returnValid = (newPassDirty && newPassValid && passwordsMatch) || (newPassEmptyOrPristine && verifyPassValidLength);
        if (verifyPassDirty) {
          //var returnVal = verifyPassValid && (vm.passwordData.passwordsMatch || (!vm.passwordData.passwordsMatch && ($scope.passwordForm.newPass.$invalid && $scope.passwordForm.newPass.$dirty)));
          return returnValid;
        } else {
          return true;
        }
      }
    },
    passwordsMatch: false
  };

  var originalData = angular.copy(vm.passwordData);

  vm.formSubmitted = false; // set this upon click
  vm.buttonText = 'Submit';

  $log.debug($scope);

  vm.resetForm = function() {
    vm.passwordData = angular.copy(originalData);
    $scope.passwordForm.$setPristine();
  };

  vm.validateField = function(status) {
    //console.log('validation fired on blur: ');
    $log.debug(status);
    var errorStrings = (ValidationSvc.getValidationString(status));
    //$log.debug(errorStrings);
    if (typeof errorStrings !== 'undefined' && errorStrings.length > 0) {
      MessagesSvc.registerErrors(errorStrings);
    }
  };

  $scope.$watchCollection(function(){
    return [vm.passwordData.newPass.value, vm.passwordData.verifyPass.value];
  }, function(newVal, oldVal, scope){
    if ((scope.passwordForm.newPass.$modelValue === scope.passwordForm.verifyPass.$modelValue) && scope.passwordForm.newPass.$modelValue !== null && scope.passwordForm.newPass.$valid) {
      vm.passwordData.passwordsMatch = true;
    } else {
      vm.passwordData.passwordsMatch = false;
    }

    // if (angular.isUndefined(scope.passwordForm.newPass.$modelValue) && scope.passwordForm.newPass.$viewValue === '') {
    //   scope.passwordForm.newPass.$setPristine();
    // }
    //  if (angular.isUndefined(scope.passwordForm.verifyPass.$modelValue) && scope.passwordForm.verifyPass.$viewValue === '') {
    //   scope.passwordForm.verifyPass.$setPristine();
    // }
    //$log.debug(scope.passwordForm.verifyPass);
    //$log.debug(scope.passwordForm);
  });

  vm.submit = function() {
      vm.formSubmitted = true;
      AuthenticationSvc.updatePassword(vm.passwordData.oldPass.value, vm.passwordData.newPass.value, vm.passwordData.verifyPass.value).then(function(response){
        $log.debug('AuthenticationSvc.updatePassword response is:: ');
        //$log.debug(response);
        if (response.status === 200 && response.data.status === 'success') {
          vm.formSubmitted = false; // allow re-submission
          passwordCheckPassed = true;
          //vm.resetForm(); // clear form data model & set pristine
          UserSvc.setUserKey('acctStatus', 'ACT'); //seems like we need to get this back from the service, bringing up with Beni as a todo
          return UserSvc.getSecQAIsSet();
        }
      }, function(reason) {
        vm.formSubmitted = false; // allow re-submission
        $log.error('Could not update the user\'s password because of: ');
        $log.error(reason);
        //vm.resetForm(); // clear form data model & set pristine
      }).then(function(secQAIsSet){
        if (passwordCheckPassed){
          if (secQAIsSet) {
            UserSvc.routeToHome();
          } else {
            $location.path('/security').replace();
          }
        } //do nothing if there's nothing else to do (sec q and a) rather than re-routing to home
      }, function(reason){
        vm.formSubmitted = false; // allow re-submission
        //$log.debug('form submttted is: ' + vm.formSubmitted);
        $log.error('Could not get security Q and A status because:: ');
        $log.error(reason);
        //vm.resetForm(); // clear form data model
      });
  };

  //functions

  //helper function for validating password fields
  function updatePasswordValues(event) {
    var errorIsShowing = vm.passwordData.newPass.showRequired || vm.passwordData.newPass.showInvalid || vm.passwordData.verifyPass.showRequired || vm.passwordData.verifyPass.showInvalid || vm.passwordData.verifyPass.showMismatch;

    newPassModelVal = $scope.passwordForm.newPass.$modelValue;
    verifyPassModelVal = $scope.passwordForm.verifyPass.$modelValue;
    newPassDirty = $scope.passwordForm.newPass.$dirty;
    newPassValid = $scope.passwordForm.newPass.$valid;
    verifyPassDirty = $scope.passwordForm.verifyPass.$dirty;
    verifyPassValid = $scope.passwordForm.verifyPass.$valid;
    newPassEmpty =  newPassModelVal === '' || angular.isUndefined(newPassModelVal);
    newPassEmptyOrPristine = !newPassDirty || newPassEmpty;
    verifyPassEmpty =  verifyPassModelVal === '' || angular.isUndefined(verifyPassModelVal);
    verifyPassEmptyOrPristine = !verifyPassDirty || verifyPassEmpty;
    verifyPassValidLength = !$scope.passwordForm.verifyPass.$error.maxlength && !$scope.passwordForm.verifyPass.$error.minlength && !$scope.passwordForm.verifyPass.$error.required;
    newPassValidLength = !$scope.passwordForm.newPass.$error.maxlength && !$scope.passwordForm.newPass.$error.minlength && !$scope.passwordForm.newPass.$error.required;
    passwordsMatch = vm.passwordData.passwordsMatch;

    if (event || errorIsShowing) { //the only thing that will be returning an event is blur
      //$log.debug(event);
    //validate newPass
      if (newPassDirty && !vm.passwordData.newPass.hasFocus) { 
        vm.passwordData.newPass.showRequired = $scope.passwordForm.newPass.$error.required;
        vm.passwordData.newPass.showInvalid = $scope.passwordForm.newPass.$error.minlength || $scope.passwordForm.newPass.$error.maxlength;
      }

      //validate verifyPass
      var showVerifyRequired = $scope.passwordForm.verifyPass.$error.required,
          showVerifyInvalid = $scope.passwordForm.verifyPass.$error.minlength || $scope.passwordForm.verifyPass.$error.maxlength,
          showVerifyMismatch = !vm.passwordData.newPass.hasFocus && verifyPassValidLength && $scope.passwordForm.verifyPass.$error.validator && newPassValid && !passwordsMatch;
      if ($scope.passwordForm.verifyPass.$dirty && !vm.passwordData.verifyPass.hasFocus) {
        vm.passwordData.verifyPass.showRequired = showVerifyRequired;
        vm.passwordData.verifyPass.showInvalid = showVerifyInvalid;
        vm.passwordData.verifyPass.showMismatch = showVerifyMismatch;
      }
    }

    
  }

}
}());
