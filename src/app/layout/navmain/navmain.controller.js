'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:NavMainCtrl
 * @description
 * # NavMainCtrl
 * Controller of the riskShareApp
 */

(function() {

  angular.module('riskShareAppLayout').controller('NavMainCtrl', NavMainCtrl);

  NavMainCtrl.$inject = ['NavMainSvc', 'UserSvc', 'AuthenticationSvc', '$q', '$log', '$scope', '$rootScope', '$location', '$timeout'];

  function NavMainCtrl(NavMainSvc, UserSvc, AuthenticationSvc, $q, $log, $scope, $rootScope, $location, $timeout) {

    var vm = this, //I am not setting properties on this vm before creating them in the init. Does not seem to be an issue (doing so actually is creating problems in the view), and Angular supposedly handles undefined vm properties gracefully
      vmObjStore = {},
      triggeredByLogin = false;
    vm.menuNavMain = [];
    vm.navReady = false;
    vmObjStore.roleClasses = [];
    vmObjStore.activeNavItem = '';

    vm.init = function(reason) {
      vm.navReady = false;

      $log.debug('menunavmain is: ');
      $log.debug(vm.menuNavMain);
      $log.debug('activenav is: ');
      $log.debug(vmObjStore.activeNavItem);
      $log.debug('roleclasses is: ');
      $log.debug(vmObjStore.roleClasses);

      if (reason === 'login' || (vm.menuNavMain.length === 0 && vmObjStore.roleClasses.length === 0 && vmObjStore.activeNavItem === '')) {
        initFn();
      }

      function initFn() {
        NavMainSvc.createMenu().then(function(menu) {
          vm.menuNavMain = menu;
          return NavMainSvc.setMenuItemRoleClasses(vm.menuNavMain);
        }).then(function(menuNavMain) {
          //vmObjStore.roleClasses = roleClasses;
          vm.menuNavMain = menuNavMain;
          NavMainSvc.setNavIsReady().then(function(response){
            $log.debug('Nav should be ready');
          }, function(reason){
            $log.error('Nav is not ready beause:: ');
            $log.error(reason);
          });
          $log.debug('menu init success!');
        }).then(null, function(error) {
          $log.error(error);
        });
      }
      //set up the menu before vm.init
      //} //no conditional block
    };

    //binding to routeChangeStart in controllers that aren't route-bound to make sure values are availble when the view is shown. Conditionally executing the init function based on the state of local vars that should only need to be set on full page refresh
    $scope.$on('$routeChangeStart', function(event, next, current) { //need to bind to routeChange to trigger the menu update and avoid double-looping of an evaluated expression in the ng-class binding
      //and, it's the only thing that's worked! - necesary because this controller is not bound to a route
      if (!triggeredByLogin && AuthenticationSvc.getIsLoggedIn()) {
        vm.init('routeChange');
      }
    });

    $scope.$on('$routeChangeSuccess', function(event, next, current) {
      vm.navReady = false;
      angular.forEach(vm.menuNavMain, function(value, key) { //loop over the nav
        var currPath = value.path.substring(1);
        value.activeNavItem = $location.path() === currPath; //this creates a new boolean value available to the ng-class on the nav list-items, and updates every time the route changes. In the markup, I add the class active if this evaluates to true
      });
      //$timeout(function(){
      vm.navReady = true;
      //}, 0);
    });

    $scope.$on('loginEvent', function() {
      triggeredByLogin = true;
      vm.init('login');
    });

  }

}());
