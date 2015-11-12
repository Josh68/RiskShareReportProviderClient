'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:HeaderCtrl
 * @description
 * # HeaderCtrl
 * Controller of the riskShareApp
 */

(function() {

  angular
    .module('riskShareAppLayout')
    .controller('HeaderCtrl', HeaderCtrl);

  HeaderCtrl.$inject = ['$rootScope', '$scope', '$route', '$log', 'AuthenticationSvc', 'UserSvc', 'CONTENT', '$location', 'MessagesSvc'];

  function HeaderCtrl($rootScope, $scope, $route, $log, AuthenticationSvc, UserSvc, CONTENT, $location, MessagesSvc) {
    var vm = this;
    vm.appName = {
      title: CONTENT.application.name,
      disableable: true,
      action: routeToHome
    };
    //vm.pageTitle = $route.current.$$route.controllerAs === 'login' ? $rootScope.routeTitle : $rootScope.pageTitle;
    //vm.pageTitle;
    vm.isHome = false;

    $scope.$on('$routeChangeSuccess', function() {
      vm.isHome = $location.path().substring(1) === 'home';
      if (!angular.isUndefined($route.current)) {
        if (!angular.isUndefined($route.current.$$route)) {
          if (!angular.isUndefined($route.current.$$route.controllerAs)) {
            if (angular.isUndefined($route.current.$$route.title) && angular.isUndefined($route.current.$$route.settings.title)) {
              vm.pageTitle = '';
            } else if (!angular.isUndefined($route.current.$$route.title) && !angular.isUndefined($route.current.$$route.settings.title)) {
              vm.pageTitle = $route.current.$$route.controllerAs === 'login' ? $route.current.$$route.title : $route.current.$$route.settings.title;
            } else if (!angular.isUndefined($route.current.$$route.title)) {
              vm.pageTitle = $route.current.$$route.title;
            } else if (!angular.isUndefined($route.current.$$route.settings.title)) {
              vm.pageTitle = $route.current.$$route.settings.title;
            }
          } else {
            vm.pageTitle = '';
          }
        }
      }

      //The logic in the commented-out block below may be used again later. There were content requests for titles to change according to flow, but those were later retracted.

      // if (AuthenticationSvc.getIsLoggedIn()) { //check whether the user needs to do initial security stuff after login
      //   var passwordIsSet = false,
      //     securityQAIsSet = false;
      //   UserSvc.getPasswordIsSet().then(function(pwdBool) {
      //     passwordIsSet = pwdBool;
      //     $log.debug('Password Is Set:: ' + passwordIsSet);
      //     return UserSvc.getSecQAIsSet();
      //   }).then(function(qABool) {
      //     securityQAIsSet = qABool;
      //     $log.debug('Security Is Set:: ' + securityQAIsSet);
      //     if (((!passwordIsSet && $route.current.$$route.controllerAs === 'password') || (!securityQAIsSet && $route.current.$$route.controllerAs === 'security')) && !angular.isUndefined($route.current.$$route.settings.securityTitle)) {
      //       vm.pageTitle = $route.current.$$route.settings.securityTitle; //change the page title if we're in initial security flow
      //     }
      //   });
      // }
      
    });

    vm.menuNavUtil = [{
      title: CONTENT.menus.navUtil.modaHome.title,
      path: CONTENT.menus.navUtil.modaHome.path,
      target: '_blank'
    }, {
      title: CONTENT.menus.navUtil.contact.title,
      path: CONTENT.menus.navUtil.contact.path,
      target: '_blank'
    }];

    vm.menuLoggedIn = [{
      title: CONTENT.menus.navLoggedIn.password.title,
      path: CONTENT.menus.navLoggedIn.password.path,
      action: function() {
        return angular.noop();
      },
      disableable: true,
      showOnHome: false
    }, {
      title: CONTENT.menus.navLoggedIn.logout.title,
      path: CONTENT.menus.navLoggedIn.logout.path,
      action: function() {
        MessagesSvc.clearErrors();
        MessagesSvc.clearInfoMsgs();
        return AuthenticationSvc.logout();
      },
      disableable: false,
      showOnHome: true
    }];

    function routeToHome() {
      return UserSvc.routeToHome();
    }

  }

}());
