'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:VerifySecurityCtrl
 * @description # VerifySecurityCtrl Controller of the riskShareApp
 */

(function() {

    angular.module('riskShareApp').controller('VerifySecurityCtrl', VerifySecurityCtrl);

    VerifySecurityCtrl.$inject = [ 'DataSvc', 'ctrlOptions', '$location', '$rootScope', '$scope', '$log', 'CONTENT' ];

    /**
     * Verify security Controller responsible for the API check. After a successful check, this will return to the calling service 'forgotPassword'. 
     * If this is coming from a the 'forgotUsername' the process ends here.
     * 
     * @param DataSvc Riskshare data access service.
     * @param ctrlOptions Riskshare controller service.
     * @param $location Angular service.
     * @param $rootScope Angular service.
     * @param $scope Angular service.
     * @param $log Angular service.
     */
    function VerifySecurityCtrl(DataSvc, ctrlOptions, $location, $rootScope, $scope, $log, CONTENT) {
	var vm = this,
	queryParams = $location.search();
	vm.email = '';
	vm.question = '';
	vm.username = '';
	vm.answer = '';
	vm.formSubmitted = false;
	vm.validationFinished = false;
	vm.forgotUsername = ctrlOptions.isForgotUsername; // boolean value
	vm.forgotPassword = ctrlOptions.isForgotPassword; // boolean value
  vm.verifySecurityFormId = CONTENT.userMgmt.verifySecurityFormId;

	vm.verifyQuestion = function() {
	    vm.formSubmitted = true;
	    var reqObject;
	    if (vm.username && vm.forgotPassword){
		    reqObject = {
			'answer' : vm.answer,
			'username' : vm.username
		    };
	    } else if (vm.email && vm.forgotUsername){
		    reqObject = {
			'answer' : vm.answer,
			'email' : vm.email
		    };
	    }

	    DataSvc
		    .request('POST', 'verifySecurity', reqObject)
		    .then(
			    function(response) {
				vm.formSubmitted = true;
				if (response.status === 200 && response.data.status === 'success') {
				    vm.validationFinished = true;
				}
				$log.debug('VerifySecurity response is:: ');
				$log.debug(response);
				vm.formSubmitted = false;
			    },
			    function(reason) {
				$log.error('Problem occured while verifying user information: ');
				$log.error(reason);
				vm.formSubmitted = false;
			    });
	};

	/**
	 * This part is considered to be executed when 'Security Question' is asked from 'Forgot Username' flow. The email and question are passed as query param. 
	 */
	if (queryParams.question && typeof queryParams.question === 'string' && queryParams.email && typeof queryParams.email === 'string') {
	 vm.email = queryParams.email;
	 vm.question = queryParams.question;
	}

	/**
	 * This part is considered to be executed when 'Security Question' is asked from 'Forgot Password' flow. The username and question are passed as query param. 
	 */
	if (queryParams.question && typeof queryParams.question === 'string' && queryParams.username && typeof queryParams.username === 'string') {
	 vm.username = queryParams.username;
	 vm.question = queryParams.question;
	}

    }
}());
