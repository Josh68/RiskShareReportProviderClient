'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:routeChange
 * @description
 * # routeChange
 * Service of the riskShareApp
 */

//All the global stuff that need to happen on route change start and success

(function() {

  angular
    .module('services.core.RouteChange', [])
    .factory('RouteChangeSvc', RouteChangeSvc);

  RouteChangeSvc.$inject = ['$rootScope', '$location', '$log', '$q', 'usSpinnerService', 'HealthCheckSvc', 'MessagesSvc', 'AuthInterceptorSvc', 'AuthenticationSvc', 'DataSvc', '$window'];

  function RouteChangeSvc($rootScope, $location, $log, $q, usSpinnerService, HealthCheckSvc, MessagesSvc, AuthInterceptorSvc, AuthenticationSvc, DataSvc, $window) {

    var lastRoute = '/';

    var service = {
      onstart: onstart,
      onsuccess: onsuccess
    };

    return service;

    ////////////

    function onstart() {
      $rootScope.$on('$routeChangeStart', function(event, next, current) {
        //Try to capture the current route and set the lastRoute variable to this. That way, we can navigate back from the "notfound" page

        $rootScope.isLoggedIn = AuthenticationSvc.getIsLoggedIn();
        $log.debug('Am I still logged in? ' + $rootScope.isLoggedIn);

        if (!$rootScope.isLoggedIn) { //do a healthcheck before login
          HealthCheckSvc.healthCheck().then(function(success){
            $log.debug('RETURNED FROM HealthCheckSvc');
            $log.debug(success);
            if (!success) {
              //do nothing, message should be posted
              //further handling in login controlelr
            }
          });
        }

        if (typeof current !== 'undefined') {
          if (typeof current.$$route !== 'undefined') {
            var currentPath = current.$$route.originalPath;
            $log.debug('on routeChangeStart, path is: ' + currentPath);
            lastRoute = current.$$route.originalPath;
          }
        }
        //next block is the basic interceptor for checking auth and loggedin status.
        //TODO - still needs refinement/refactoring with token auth
        if (typeof AuthInterceptorSvc.requiresAuth(next) !== 'undefined') {
          var needsAuth = AuthInterceptorSvc.requiresAuth(next), //see if the next route needs auth
            response = AuthInterceptorSvc.response,
            responseStatus = response.status,
            notAuthorized = responseStatus === 401;
          //sessionExpired = AuthenticationSvc.getCredentials; //need to work out a way to get session status - this isn't right, and shouldn't use a cookie if we move to tokens
          if (next.$$route !== undefined) {
            $log.debug('the route ' + next.$$route.originalPath.slice(1) + ' is restricted: ' + needsAuth);
          } else {
            $log.debug('the next route is not defined and therefore isn\'t restricted');
          }

          if (needsAuth && (notAuthorized || !$rootScope.isLoggedIn)) { //check to see if 1) the page needs auth and 2) the user isn't authorized or 2) the user isn't logged in
            AuthenticationSvc.logout(); //do this in the service
          }
        } else {
          //stub something in here to handle any situation where auth requirement is undefined
          $log.debug('cannot determine whether next route requires authentication');
        }

      });
    }

    function onsuccess() {
      $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
        //$log.debug('WHAT IS THE CURRENT OBJECT ON ROUTECHANGESUCCESS?');
        //$log.debug(current);
        var stillLoggedIn = AuthenticationSvc.getIsLoggedIn();
        if (stillLoggedIn) { //if the user is logged in (checked at routeChangeStart), get a new token via reauth to reset user timeout
          DataSvc.session.reauth(); 
        }
        if (!stillLoggedIn) {
          MessagesSvc.clearInfoMsgs();
        }
        if (current !== previous && typeof current.$$route !== 'undefined') {
          usSpinnerService.stop('spinner-1'); //stop any spinner
          $log.debug('current.$$route is: ' + current.$$route.originalPath);
          if (!angular.isUndefined(current.$$route.settings)) {
            $rootScope.title = current.$$route.settings.title + ' - Moda Health Risk Share Reports';
            $rootScope.pageTitle = current.$$route.settings.title;
            $rootScope.routeTitle = '';
            $rootScope.securityTitle = '';
            //set routeTitle and securityTitle if they exist in the config
            if (!angular.isUndefined(current.$$route.title)) {
              $rootScope.routeTitle = current.$$route.title; //in case we need an extra title, as on login (outside of the settings object)
            }
            if (!angular.isUndefined(current.$$route.settings.securityTitle)) {
              $rootScope.securityTitle = current.$$route.settings.securityTitle;
            }
            $log.debug('hit GA tracking block');
            if (!$window.ga) {
              return;
            } else {
              // send path and title to GoogleAnalytics
              $window.ga('send', 'pageview', {
                'page': $location.path(),
                'title': current.$$route.settings.title
              });
            }
          }
          $rootScope.notLoginPage = current.$$route.controllerAs !== 'login';
          $rootScope.loginPage = current.$$route.controllerAs === 'login';
          $rootScope.goBack = function() { //problem here - when I redirect to notfound, I have no previous route. how to fix??
            if (typeof previous !== 'undefined') {
              if (typeof previous.$$route !== 'undefined') {
                $log.debug(previous);
                $location.path(previous.$$route.originalPath);
              } else {
                $location.path(lastRoute); //this will either be the current route recorded on routeChangeStart or the root path (login)
              }
            }
          };
        }
      });
    }
  }

}());
