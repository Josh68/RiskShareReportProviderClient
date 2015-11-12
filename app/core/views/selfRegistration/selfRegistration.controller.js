'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:SelfRegistrationCtrl
 * @description # SelfRegistrationCtrl of the riskShareApp
 */

(function() {

    angular.module('riskShareApp').controller('SelfRegistrationCtrl', SelfRegistrationCtrl);

    SelfRegistrationCtrl.$inject = ['AuthenticationSvc', 'UserSvc', 'DataSvc', 'usSpinnerService', '$location', '$rootScope', '$scope', '$log', 'CONTENT' ];

    /**
     * Self Registration controller. Is responsible for verifying user information through the API. 
     * If this is successfully done, it will go to the next step verification for secret question/ answer.
     * 
     * @param DataSvc Riskshare data access service.
     * @param $location Angular service.
     * @param $rootScope Angular service.
     * @param $scope Angular service.
     * @param $log Angular service.
     */
    function SelfRegistrationCtrl(AuthenticationSvc, UserSvc, DataSvc, usSpinnerService, $location, $rootScope, $scope, $log, CONTENT) {
	var vm = this,
	queryParams = $location.search();

	vm.firstName = '';
	vm.lastName = '';
	vm.email = '';
	vm.question = '';
	vm.token = '';
	vm.formSubmitted = false;
	vm.stepTwo = false;
	vm.username = '';
  vm.verifyUserFormId = CONTENT.userMgmt.verifyUserFormId;
  vm.createUserFormId = CONTENT.userMgmt.createUserFormId;

	/**
	 * Data structure for password fields along with validation.
	 */
	vm.passwordData = {
        username: {
          hasFocus: false,
          showRequired: function() {
            return $scope.selfRegistration.createUserForm.username.$dirty && $scope.selfRegistration.createUserForm.username.$viewValue === '' && !vm.passwordData.username.hasFocus ? true : false;
          }
        },
	      newPass: {
	        value: '',
	        hasFocus: false,
	        showRequired: function() {
	          return $scope.selfRegistration.createUserForm.newPass.$dirty && $scope.selfRegistration.createUserForm.newPass.$error.required && !vm.passwordData.newPass.hasFocus ? true : false;
	        },
	        showInvalid: function() {
	          return ($scope.selfRegistration.createUserForm.newPass.$dirty && !vm.passwordData.newPass.hasFocus) && ($scope.selfRegistration.createUserForm.newPass.$error.minlength || $scope.selfRegistration.createUserForm.newPass.$error.maxlength) ? true : false;
	        }
	      },
	      verifyPass: {
	        value: '',
	        hasFocus: false,
	        showRequired: function() {
	          return $scope.selfRegistration.createUserForm.verifyPass.$dirty && !vm.passwordData.verifyPass.hasFocus && $scope.selfRegistration.createUserForm.verifyPass.$error.required ? true : false;
	        },
	        showInvalid: function() {
	          return ($scope.selfRegistration.createUserForm.verifyPass.$dirty && 
	        	  !vm.passwordData.verifyPass.hasFocus) && 
	        	  ($scope.selfRegistration.createUserForm.verifyPass.$error.minlength || $scope.selfRegistration.createUserForm.verifyPass.$error.maxlength) ? true : false;
	        },
	        showMismatch: function() {
	          return !vm.passwordData.verifyPass.hasFocus && 
	          	!vm.passwordData.newPass.hasFocus && 
	          	!$scope.selfRegistration.createUserForm.verifyPass.$error.required && 
	          	!$scope.selfRegistration.createUserForm.verifyPass.$error.minlength && 
	          	!$scope.selfRegistration.createUserForm.verifyPass.$error.maxlength && 
	          	$scope.selfRegistration.createUserForm.verifyPass.$error.validator && 
	          	$scope.selfRegistration.createUserForm.newPass.$valid && 
	          	!vm.passwordData.passwordsMatch ? true : false;
	        }
	      },
	      passwordsMatch: false
	    };

	var originalPasswordData = angular.copy(vm.passwordData);

	
	$scope.$watchCollection(function(){
	 return [vm.passwordData.newPass.value, vm.passwordData.verifyPass.value];
	}, function(newVal, oldVal, scope){
	    if ((scope.selfRegistration.createUserForm.newPass.$modelValue === scope.selfRegistration.createUserForm.verifyPass.$modelValue) && scope.selfRegistration.createUserForm.newPass.$modelValue !== null && scope.selfRegistration.createUserForm.newPass.$valid) {
        	vm.passwordData.passwordsMatch = true;
	    } else {
        	vm.passwordData.passwordsMatch = false;
	    }
	    if (angular.isUndefined(scope.selfRegistration.createUserForm.newPass.$modelValue) && scope.selfRegistration.createUserForm.newPass.$viewValue === '') {
        	scope.selfRegistration.createUserForm.newPass.$setPristine();
	    }
	    if (angular.isUndefined(scope.selfRegistration.createUserForm.verifyPass.$modelValue) && scope.selfRegistration.createUserForm.verifyPass.$viewValue === '') {
        	scope.selfRegistration.createUserForm.verifyPass.$setPristine();
	    }
	});

	
	vm.accountVerify = function() {
	    vm.formSubmitted = true;

	    var verifyUserObj = {
		'token' : vm.token,
		'firstName' : vm.firstName,
		'lastName' : vm.lastName,
		'email' : vm.email
	    };

	    DataSvc.credentials.VerifyTokenAndUserInfo.verify(verifyUserObj, 
		function(response) {
                	if (response.status === 'success') {
                	    vm.stepTwo = true;
                	}
    		},
    		function(reason) {
    		    $log.error('Problem occured while verifying user information: ');
    		    $log.error(reason);
    		    vm.formSubmitted = false;
    		});
	vm.formSubmitted = false;   
	};

	
	vm.accoutCreate = function() {
	    vm.formSubmitted = true;
	    vm.startSpin();
	    var verifyUserObj = {
		'token' : vm.token,
		'username' : vm.username,
		'password' : vm.passwordData.newPass.value,
		'retypePassword' : vm.passwordData.verifyPass.value,
		'firstName' : vm.firstName,
		'lastName' : vm.lastName,
		'email' : vm.email
	    };

	    DataSvc.credentials.AccountCreate.create(verifyUserObj, 
		function(response) {
            	if (response.status === 'success') {
            	 vm.stepTwo = null;
	         AuthenticationSvc.login(vm.username, vm.passwordData.newPass.value).then ( //chaining promises, first login
	                  function(response) { //login success calls the setSession function in the AuthenticationSvc
	                    AuthenticationSvc.setSession().then( //if setSession is successful
	                      function(response) { //log info and take us home
	                        vm.stopSpin();
	                        vm.formSubmitted = false;
	                        $location.path('/security').replace();
	                        $log.debug(response);
	                        $log.debug('logged in (this should be the 3rd step)');
	                      },
	                      function(reason) {
	                        vm.stopSpin();
	                        $log.debug('authentiaction error reason: ' + reason);
	                      }
	                    );
	                  },
	                  function(reason) {
	                    vm.stopSpin();
	                    vm.formSubmitted = false;
	                    $log.debug('login error reason:');
	                    $log.debug(reason);
	                    //do nothing
	                  }
        	         );
            	}
    		},
    		function(reason) {
    		    $log.error('Problem occured while creating user account: ');
    		    $log.error(reason);
    		    vm.formSubmitted = false;
    		});
	vm.formSubmitted = false;   
	};

	/**
	 * This part is considered to be executed when 'Self Registration' flow is triggered. The token is passed as query parameter. 
	 */
	if (queryParams.token && typeof queryParams.token === 'string') {
	 vm.token = queryParams.token;
	}

    vm.startSpin = function() {
      usSpinnerService.spin('spinner-1');
    };

    vm.stopSpin = function() {
      usSpinnerService.stop('spinner-1');
    };

    }

}());
