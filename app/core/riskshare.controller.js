 'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:RiskShareCtrl
 * @description
 * # Main
 * Controller of the riskShareApp
 */

(function() {

  angular
    .module('riskShareAppCore')
    .controller('RiskShareCtrl', RiskShareCtrl);

  RiskShareCtrl.$inject = ['$rootScope', '$scope', '$log', '$window', '$location', '$timeout', '$sce', '$templateCache', 'USER_STORE_PREFIX', 'API_URL', 'API_PATHS', 'AuthenticationSvc', 'UserSvc', 'DataSvc', 'MessagesSvc', 'TIPSOCONFIG', 'CONTENT', 'ngDialog', '$compile'];

  function RiskShareCtrl($rootScope, $scope, $log, $window, $location, $timeout, $sce, $templateCache, USER_STORE_PREFIX, API_URL, API_PATHS, AuthenticationSvc, UserSvc, DataSvc, MessagesSvc, TIPSOCONFIG, CONTENT, ngDialog, $compile) {
    var vm = this,
      store = $window.localStorage,
      storeSecQAIsSet = store[USER_STORE_PREFIX + 'securityQASet'],
      storeAcctStatus = store[USER_STORE_PREFIX + 'acctStatus'],
      timeoutDialogId;

    vm.passwordIsSet = false;
    vm.secQAIsSet = false;
    vm.disable = false;
    vm.isLoggedIn = false;
    vm.roles = { //TODO - refactor to use this object instead of the separate values
      isContact: false,
      isReportsAdmin: false,
      isViewer: false,
      isEntityAdmin: false
    };
    vm.isContact = false;
    vm.isReportsAdmin = false;
    vm.isViewer = false;
    vm.isEntityAdmin = false;
    vm.isHome = false;
    vm.footerContent = '';
    vm.token = store.getItem(USER_STORE_PREFIX + 'auth-token');
    vm.user = {};
    vm.tipsoConfig = TIPSOCONFIG;
    vm.returnToSearch = CONTENT.returnToSearch;
    vm.showReturnToSearch = function(){
      var queryParams = $location.search(),
          hasSearchParams = false;
      angular.forEach(queryParams, function(value, prop){
        if (prop.indexOf('search_') > -1) {
          hasSearchParams = true;
        }
      });
      return hasSearchParams;
    };
    vm.viewContentLoaded = false;
    vm.includeContentLoaded = false;

    var init = function() {
      if(AuthenticationSvc.getIsLoggedIn()){
        getUserRoles();
        getSecurityStatus();
        if (angular.isUndefined(vm.user.firstName)) {
          getFirstName();
        }
        if (angular.isUndefined(vm.user.userId)) {
          getUserId();
        }
      }
    };

    //update the token every time there's a token update to localStorage
    $scope.$on('tokenUpdate', function() {
      vm.token = store.getItem(USER_STORE_PREFIX + 'auth-token');
    });

    $scope.$on('$viewContentLoaded', function() {
      $timeout(function() {
        vm.viewContentLoaded = true;
      }, 25);
    });

    $scope.$on('$includeContentLoaded', function() {
      $timeout(function() {
        vm.includeContentLoaded = true;
      }, 25);
    });

    angular.forEach('loginSuccess logoutSuccess'.split(' '), function (event) {
      $scope.$on(event, function() {
        vm.user = {};
      });
    });

    vm.reauth = function() { //This is used by both reports pages to get a new token. Should be abstracted into a plain reauth endpoint (generic way of getting a new token)
      $window.setTimeout(function() {
        DataSvc.request('GET', API_URL + API_PATHS.reauth).success(function(response) {
          //do nothing, because the interceptor will handle the new token
          //$log.debug('new token received');
        }).error(function(reason) {
          $log.error('could not get a reauth token because:: ');
          $log.error(reason);
        });
      });
    };

    $scope.$on('$routeChangeStart', function() {
      init();
    });

    $scope.$on('$routeChangeSuccess', function(event, current, previous) {
      vm.isHome = addLocationClasses.call(current, '/home');
      vm.isEntityMgmt = addLocationClasses.call(current, '/entities');
      vm.isReportsMgmt = addLocationClasses.call(current, '/reports');
    });

    $scope.$on('storageValueSet', function(){
      getSecurityStatus();
      getUserRoles();
      // UserSvc.getUser('chosenRole').then(function(response){
      //   if (response === 'int.EntityAdmin') {
      //     vm.entityAdmin = true;
      //     vm.reportAdmin = false;
      //   }
      //   if (response === 'int.ReportAdmin') {
      //     vm.entityAdmin = false;
      //     vm.reportAdmin = true;
      //   }
      // }, function(reason){
      //   //there is no chosenRole for this user
      //   $log.debug('there is no chosenRole for this user');
      // });
    });

    $scope.$on('timeoutWarning', throwTimeoutWarning);
    $scope.$on('runTimeout', function() {
      ngDialog.close(timeoutDialogId, false); //pass the boolean to keep this controller from calling for logout
      DataSvc.session.reauth().then(function(response){
        $log.debug('Tried to use reauth to logout the user, but instead it reauthorized the user and handed back a new token with a new expiration.');
      }, function(reason){
        $log.error('this should have prompted the server to return a 419 and sent the user to login with a message');
      });
      // $timeout(function(){
      //   MessagesSvc.registerInfoMsg('You have been logged out.')
      // });
    });
    $scope.$on('timeoutExpired', function() { //this is one way to handle the closing of the timeout dialog
      ngDialog.close(timeoutDialogId, false);
    });

    //functions

    function addLocationClasses(routeString) { // validthis:true
      var current = this; // jshint ignore:line 
      if (current.$$route.originalPath.indexOf(routeString) > -1) {
        return true;
      }
      return false;
    }

    function getSecurityStatus() {
      UserSvc.getPasswordIsSet().then(function(passwordIsSet) { //this should return a boolean
        vm.passwordIsSet = passwordIsSet;
        return UserSvc.getSecQAIsSet(); //this should return a boolean
      }).then(function(secQAIsSet) {
        $log.debug('INSIDE MAIN APP CONTROLLER INIT, SEC QA SET IS: ' + secQAIsSet);
        vm.secQAIsSet = secQAIsSet;
        if (!secQAIsSet || secQAIsSet === 'false' || !vm.passwordIsSet || vm.passwordIsSet === 'false') {
          vm.disable = true;
        } else {
          vm.disable = false;
        }
        vm.isLoggedIn = AuthenticationSvc.getIsLoggedIn();
        $log.debug('THE VALUE OF RSAPP (MAIN CONTROLLER) DISABLE IS: ' + vm.disable);
        $log.debug('THE VALUE OF RSAPP (MAIN CONTROLLER) ISLOGGEDIN IS: ' + vm.isLoggedIn);
      });
    }

    function getUserRoles() {
      UserSvc.getUserRoles().then(function(response) {
        var rolesArr = angular.isArray(response) ? response : [];
        $log.debug('rolesArr inside riskshare controller [core] is');
        $log.debug(rolesArr);
        angular.forEach(vm.roles, function(value, key){ //reset the roles array each time
          vm.roles[key] = false; 
        });
        for (var role = 0; role < rolesArr.length; role++) {
          if (addVmRole('ext.ProvContact')) {
            vm.roles.isContact = true;
          }
          if (addVmRole('int.ReportAdmin')) {
            vm.roles.isReportsAdmin = true;
          }
          if (addVmRole('int.Viewer')) {
            vm.roles.isViewer = true;
          }
          if (addVmRole('int.PreAdmin')) {
            vm.roles.isEntityAdmin = true;
          }
        }
        function addVmRole(roleString) {
          if (rolesArr[role].indexOf(roleString) !== -1) {
            return true;
          }
          return false;
        }
        $log.debug('isContact? ' + vm.roles.isContact + ', isReportsAdmin? ' + vm.roles.isReportsAdmin + ', isViewer? ' + vm.roles.isViewer + ', isEntityAdmin? ' + vm.roles.isEntityAdmin);
      }, function(reason) {
        $log.error('could not get user roles from the user service for the main controller');
      });
    }

    function getFirstName() {
      UserSvc.getUserFirstName().then(function(response) {
        vm.user.firstName = response;
      }, function(reason) {
        $log.error('could not set username on main controller');
      });
    }

    function getUserId() {
      UserSvc.getUserId().then(function(response) {
        vm.user.userId = response;
      }, function(reason) {
        $log.error('could not set userId on main controller');
      });
    }

    function throwTimeoutWarning(event, minutes) {
      $log.debug('minutes from timeout service for warning: ' + minutes);
      var dialogTextLinkingFunction = $compile('<p data-countdown-timer="' + minutes + '">Your session will timeout in <span class="time-placeholder">0' + minutes + ':00</span>, do you want to continue?</p>'),
          dialogText = dialogTextLinkingFunction($scope).html(),
          dialogData = { //this content taken from EBill
            heading: 'Are you still there?',
            text: dialogText,
            confirmButton: 'Yes',
            cancelButton: 'No, log me out'
          },
          minute = 1000 * 60; //60000 milliseconds = 1 minute;

      $log.debug(dialogText);

      vm.confirmationDialog = ngDialog.openConfirm({
        template: 'core/directives/templates/confirm_dialog.html',
        data: dialogData,
        className: 'ngdialog-theme-default ngdialog-timeout',
        scope: $scope
      }).then(confirmFn, cancelFn);

      timeoutDialogId = vm.confirmationDialog.$result;

      function confirmFn(value) {
        $log.debug('Inside the confirm callback from the timeout warning dialog');
        $log.debug(value);
        DataSvc.session.reauth().then(function(response) { 
          var dialogData = { //spawn another dialog that just has a "cancel" (or close) button, confirming that "session" has been extended
            heading: 'Your session has been extended',
            cancelButton: 'Continue'
          };
          ngDialog.open({
            template: 'core/directives/templates/acknowledge_dialog.html',
            data: dialogData
          });
        }, function(reason) {
          $log.error('reauth failed because:: ');
          $log.error(reason);
          //MessagesSvc.registerErrors('We were unable to extend your session.'); //if things are working properly, we should get a message from the 419 when reauth fails (unauthorized, expired)
        });
      }

      function cancelFn(value) { //the automatic timeout functions should pass false here, while using the dialog button should pass nothing. The button should trigger logut, while the auto-triggered fns should defer to the TimeoutSvc.runTimeout, which should trigger reauth and logout if the user is expired
        $log.debug('Is there a boolean value in the timeout dialog cancelFn?');
        $log.debug(value);
        if (angular.isUndefined(value) || value) {
          MessagesSvc.clearErrors();
          MessagesSvc.clearInfoMsgs();
          AuthenticationSvc.logout();
        }
      }

    } //end throwTimeoutWarning

    (function getFooterContent() {
      var footerContentData = {
        appCode: 'GLB',
        state: 'NO',
        contentType: 'FooterDisclaimer'
      };
      var chainablePromise = DataSvc.Content.get(footerContentData);
      chainablePromise.$promise.then(function(response){
        var footerContent = $sce.trustAsHtml(response.content);
        vm.footerContent = footerContent;
      });
    }());

  }

}());
