'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:navmain
 * @description
 * # NavMain
 * Service of the riskShareApp
 */

(function() {

  angular
    .module('services.NavMain', [])
    .factory('NavMainSvc', NavMainSvc);

    /*
    * Though this service is kind of redundant with the core MenuSvc, it's not a provider, and so is easier to work with.
    * May re-evaluate what belongs in here as opposed to what's in MenuSvc, but the two evolved together, and it would be
    * a major refactor to change the references to each throughout the app
    */

  NavMainSvc.$inject = ['UserSvc', 'MenuSvc', 'AuthenticationSvc', '$window', '$timeout', '$rootScope', '$location', '$log', '$q', 'ROLE_CLASSES'];

  function NavMainSvc(UserSvc, MenuSvc, AuthenticationSvc, $window, $timeout, $rootScope, $location, $log, $q, ROLE_CLASSES) {

    var service = {
        setMenuItemRoleClasses: setMenuItemRoleClasses,
        createMenu: createMenu,
        getNavMainObj: getNavMainObj,
        setNavIsReady: setNavIsReady
      },
      navMainObjStore = {},
      store = $window.localStorage,
      navIsReady = false;

    return service;

    /////////////////

    function setNavIsReady() { //called from NavMainCtrl when all tasks are done - see if this approach works with the route resolve better than my NavReady, below
      var deferred = $q.defer();
      $timeout(function(){
        navIsReady = true;
        deferred.resolve(navIsReady);
        $rootScope.$broadcast('navIsReady');
      });
      return deferred.promise;
    }

    function getNavMainObj() {
      return navMainObjStore;
    }

    function setMenuItemRoleClasses(menuNavMain) { //function to set classes on menu that limit display of items to correct roles
      var deferred = $q.defer();
      UserSvc.getUserRoles().then(function(userRolesArr) {
        var hasSingleUserRole = userRolesArr.length === 1;
        //$log.debug('THE MENU OBJECT IS:: ');
        angular.forEach(menuNavMain, function(value, key) { //loop over the nav
          //$log.debug(value);
          var rolesArr = value.roles, //the roles array
              isHome = value.path === '#/home';
          value.addClass = {
            contact: false,
            viewer: false,
            reportadmin: false,
            entityadmin: false,
            singleuserrole: hasSingleUserRole,
            home: isHome
          };
          angular.forEach(rolesArr, function(role, key) { //loop over the roles
            //var lcRole = role.toLowerCase();
            switch (role) { //divert the first route based on role
              case 'ext.ProvContact':
                value.addClass.contact = true;
                break;
              case 'int.Viewer':
                value.addClass.viewer = true;
                break;
              case 'int.ReportAdmin':
                value.addClass.reportadmin = true;
                break;
              case 'int.PreAdmin':
                value.addClass.entityadmin = true;
                break;
            }
          });
          navMainObjStore.roleClasses = menuNavMain.roleClasses = [];
          menuNavMain.roleClasses.push(value.addClass);
          navMainObjStore.roleClasses = menuNavMain.roleClasses;
          deferred.resolve(menuNavMain);
        });
      }, function(reason) {
        $log.error('couldn\'t get user roles because:: ' + reason);
      });
      return deferred.promise;
    }

    function createMenu() { //the first thing we do inside the init, which is create the menu
      var deferred = $q.defer();
      MenuSvc.getMenuItems().then(function(response) {
        $log.debug('THE MENU ITEMS SHOULD BE:');
        $log.debug(response);
        navMainObjStore.menuNavMain = response;
        deferred.resolve(response);
      }, function(reason) {
        $log.error('couldn\'t get nav items');
        deferred.reject(reason);
      });
      return deferred.promise; //this allows us to chain the promise for the init functions
    }

  }

}());
