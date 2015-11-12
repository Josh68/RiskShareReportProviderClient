'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the riskShareApp
 */

(function() {

  angular
    .module('riskShareApp')
    .controller('LoginCtrl', LoginCtrl);

  LoginCtrl.$inject = ['AuthenticationSvc', 'UserSvc', 'NavMainSvc', 'MessagesSvc', 'HealthCheckSvc', 'usSpinnerService', '$location', '$rootScope', '$scope', '$log', '$q', 'loggedInFlag', 'ROLE_CLASSES'];

  function LoginCtrl(AuthenticationSvc, UserSvc, NavMainSvc, MessagesSvc, HealthCheckSvc, usSpinnerService, $location, $rootScope, $scope, $log, $q, loggedInFlag, ROLE_CLASSES) {
    var vm = this,
      rolesArr = [],
      secQASet = false,
      passwordSet = false,
      acctStatus = '';
    //var navIsReady = false;
    vm.username = '';
    vm.password = '';
    vm.formSubmitted = false;

    vm.login = function() {
      vm.startSpin();
      vm.formSubmitted = true;

      HealthCheckSvc.healthCheck().then(function(success) {
        if (!success) { //if this failed, the user should see an error message about services being down
          vm.stopSpin();
        } else {
          AuthenticationSvc.login(vm.username, vm.password).then( //chaining promises, first login
            function(response) { //login success calls the setSession function in the AuthenticationSvc
              AuthenticationSvc.setSession().then( //if setSession is successful
                function(response) { //log info and take us home

                  vm.stopSpin();
                  vm.formSubmitted = false;
                  $log.debug(response);
                  $log.debug('logged in (this should be the 3rd step)');
                  var userPromisesArray = [];
                  userPromisesArray.push(UserSvc.getUserRoles());
                  userPromisesArray.push(UserSvc.getSecQAIsSet());
                  userPromisesArray.push(UserSvc.getPasswordIsSet());
                  userPromisesArray.push(UserSvc.getAcctStatus());
                  //userPromisesArray.push(NavMainSvc.getNavIsReady());

                  $q.all(userPromisesArray).then(
                    function(responseArray) {
                      $log.debug('RESPONSE ARRAY');
                      $log.debug(responseArray);
                      rolesArr = responseArray[0];
                      secQASet = responseArray[1];
                      passwordSet = responseArray[2];
                      acctStatus = responseArray[3];
                      //navIsReady = responseArray[4];
                      $rootScope.$broadcast('loginEvent'); //allow login to proceed triggering the nav controller to build the nav and then trigger setNavIsReady, which broadcasts the next signal for login to finsh and routing to happen
                    },
                    function(reason) {
                      $log.debug('getting the user failed for reason: ' + reason);
                    }
                  );
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
      });
    };
    
    vm.forgotLinks = [{
        title: 'Forgot your user name',
        path: '#/forgotUsername',
        action: function() {
          return angular.noop();
        },
        disableable: false
      }, {
        title: 'Forgot your password',
        path: '#/forgotPassword',
        action: function() {
        	return angular.noop();
        },
        disableable: false
      }];

    if (typeof loggedInFlag !== 'undefined') {
      $log.debug('loggedInFlag is: ' + loggedInFlag);
      $rootScope.isLoggedIn = loggedInFlag; //Rely on this value, which checks localStorage first - it should always be false
    } else {
      //TODO - handle any problems with setting of loggedInFlag, which is in the route's resolve object
      //Should probably pull out this else block, since there should never be a reason for it being called
      $rootScope.isLoggedIn = false; //fallback just set it to false, for the UI, but still need to handle the problem
      //TODO - how to handle if we get here for some reason? This would mean that localStorage hadn't been cleared
    }

    $scope.$on('navIsReady', function() {
      if (secQASet && passwordSet) {
        UserSvc.routeToHome();
      } else if (acctStatus === 'FRC') { //FRC code means must change password
        $location.path('/password').replace();
      } else if (passwordSet && !secQASet) {
        $location.path('/security').replace();
      } else {
        $location.path('/error').replace();
      }
    });

    vm.startSpin = function() {
      usSpinnerService.spin('spinner-1');
    };

    vm.stopSpin = function() {
      usSpinnerService.stop('spinner-1');
    };

  }

}());
