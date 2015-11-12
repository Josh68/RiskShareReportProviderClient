'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:User
 * @description
 * # User
 * Service of the riskShareApp
 */

(function() {

  angular
    .module('services.core.CheckSecurity', [])
    .provider('CheckSecuritySvc', CheckSecuritySvc);

  //CheckSecuritySvc.$inject = [];

  function CheckSecuritySvc() {

    return {
      checkSecurityProvFn: function() {
        return checkSecurityFn;
      },
      $get: ['$route', '$q', '$log', '$location', '$rootScope', 'AuthenticationSvc', 'UserSvc', checkSecurityFn]
    };

    function checkSecurityFn($route, $q, $log, $location, $rootScope, AuthenticationSvc, UserSvc) {

      return {
        checkSecurity: function() {

          var deferred = $q.defer();

          UserSvc.getUserRoles().then(function(response) {
            var settings = $route.current.settings;
            var loginRequired = settings.loginRequired || false;
            var roles = settings.roles || [];
            var userRoles = response || [];
            $log.debug('THIS USER\'S CONFIG IS: ');
            $log.debug(response);

            if (loginRequired) {
              if (!AuthenticationSvc.getIsLoggedIn()) { //if the user isn't logged in, go to login
                $location.path('/login');
              } else {
                if (roles.length > 0) {
                  if (!checkRole(userRoles, roles)) { //if this user doesn't have one role in the userRoles list for the route, deny
                    $location.path('/notfound').replace();
                  }
                }
              }
            }
            deferred.resolve(true); //We want to return just true even if we have to re-route.
            //If we returned an reject, the the global handler will re-route us to home
          }, function(reason) {
            deferred.reject('could not complete the checkSecurity route routine because of error: ' + reason);
          });

          return deferred.promise;
        }
      };

      function checkRole(userRoles, rolesToCheck) {
        var returnVal = false;
        if (rolesToCheck.length === 0) {
          return true;
        }
        if (userRoles.length === 0) {
          return false;
        }
        for (var i = 0; i < userRoles.length; i++) {
          $log.debug('rolesToCheck is : ');
          $log.debug(rolesToCheck);
          $log.debug('userRoles[i] is : ');
          $log.debug(userRoles[i]);
          if (rolesToCheck.indexOf(userRoles[i]) !== -1) { //if any of the user's roles fit with roles for the route, return true
            returnVal = true;
          }
        }
        return returnVal;
      }

    }
  }

}());
