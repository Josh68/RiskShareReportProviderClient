'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:CoreConfig
 * @description
 * # CoreConfig
 * Service of the riskShareApp
 */

(function () {

  angular
    .module('services.core.Config', [])
    .provider('CoreConfigSvc', CoreConfigSvc);

  CoreConfigSvc.$inject = ['$httpProvider', '$routeProvider', '$logProvider', 'MenuSvcProvider', 'CheckSecuritySvcProvider'];

  function CoreConfigSvc($httpProvider, $routeProvider, $logProvider, MenuSvcProvider, CheckSecuritySvcProvider) {

    var pushInterceptors,
      setDefaults,
      defineRoutes,
      disableLogging;

    return {
      pushInterceptors: interceptorsFn,
      setDefaults: defaultsFn,
      defineRoutes: defineRoutesFn,
      disableLogging: disableLoggingFn,
      $get: ['$httpProvider', '$routeProvider', '$logProvider', 'MenuSvcProvider', 'CheckSecuritySvcProvider', function () {
        return {
          pushInterceptors: pushInterceptors,
          setDefaults: setDefaults,
          defineRoutes: defineRoutes,
          disableLogging: disableLogging
        };
      }]
    };

    ////////////

    function interceptorsFn() {
      $httpProvider.interceptors.push('AuthInterceptorSvc');
    }

    function defaultsFn() {
      $httpProvider.defaults.withCredentials = false; //allow CORS to set allow origin to wildcard
    }

    function disableLoggingFn(setBool) {
      $logProvider.debugEnabled(!setBool); //if disableLogging is set to true, debugEnabled = false (and converse)
    }

    //new function for defining routes

    function defineRoutesFn(routes) {

      var checkSecurity = CheckSecuritySvcProvider.checkSecurityProvFn;

      //console.log('CheckSecuritySvcProvider.checkSecurity is of type: ' + typeof CheckSecuritySvcProvider.checkSecurity);

      routes.forEach(function (route) {
        setRoute(route.url, route.config); //this builds up the routes object for the app config
        if (MenuSvcProvider.noMenuItemsInStorage) { //check to see if there are menu items in local storage
          defineMenus(route.config); //this will pull configs from the routes to build menus
        } //TODO - am I missing something here?
      });

      $routeProvider.otherwise({ //the router handler for anything not specified by defined routes
        resolve: {
          getPrevious: function ($routeParams) {
            console.log('echoing out routeParams from the otherwise handler: ');
            console.log($routeParams);
          }
        },
        redirectTo: function ($routeParams, path, search) {
          console.log($routeParams);
          console.log(path);
          console.log(search);
          return '/notfound';
        }
      });

      function setRoute(url, config) {
        //Sets resolver for all the routes
        //by extending any existing resolvers (or creating a new one).
        config.resolve = angular.extend(config.resolve || {}, { //adding the checkSecurity function from the CheckSecuritySvcProvider to determine whether the route needs auth and what roles it allows
          checkSecurity: checkSecurity
        });
        $routeProvider.when(url, config);
        return $routeProvider;
      }

    }

    //TODO - make this happen only when it needs to!!!
    function defineMenus(route) { //replacement for defineMenuItemsFn
      // console.log('displaying route settings for each route in the app: ');
      // console.log(route.settings);
      var menuArr = menuArr || [],
        routeSettings = route.settings,
        menuItems = routeSettings.menu,
        rolesArr = routeSettings.roles,
        menuNeedsTitle = true;

      for (var menuVal in menuItems) {
        //console.log('menuVal is: ' + menuVal);
        if (menuVal === 'title') {
          menuNeedsTitle = false;
        }
      }

      if (menuNeedsTitle) {
        for (var routeVal in routeSettings) {
          if (routeVal === 'title') { //if there are menu items for the route and the menu needs a title, use the page/route title
            //setPageTitle(routeSettings.title);
            if (menuItems) { //if there are menu items for the route and the menu needs a title, use the page/route title
              menuItems.title = routeSettings.title;
            }
          }
        }
      }

      if (menuItems) {
        if (rolesArr) {
          menuItems.roles = rolesArr;
        }
        //console.log('HERE ARE THE MENU ITEMS FROM WITHIN THE DEFINEMENUS FN IN CONFIG.SVC');
        //console.log(menuItems);
        menuArr.push(menuItems);
        MenuSvcProvider.addMenuItems(menuArr);
      }
    }

  }

}());
