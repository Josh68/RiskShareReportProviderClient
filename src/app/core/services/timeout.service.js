'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:Timeout
 * @description
 * # Timeout
 * Service of the riskShareApp
 */

//All the global stuff that need to happen on route change start and success

(function() {

  angular
    .module('services.core.Timeout', [])
    .factory('TimeoutSvc', TimeoutSvc);

  TimeoutSvc.$inject = ['$log', '$timeout', '$rootScope'];

  function TimeoutSvc($log, $timeout, $rootScope) {

    var service = { //returned at the bottom of this function
      setUserTimeout: setUserTimeout,
      cancelUserTimeout: cancelUserTimeout
    },
        minute = 60 * 1000,
        timeoutTime = 30,
        warningTime = 28,
        //timeoutTime = 3, //for testing
        //warningTime = 1, //for testing
        remainingTime = timeoutTime - warningTime,
        timeoutLength = timeoutTime * minute + 1000, //timeout in milliseconds, plus a padding of 1 second to exceed the server-side timeout length
        timeToWarning = warningTime * minute,
        warningLength = remainingTime * minute, //approx 2 minutes before a timeout will be run, for triggering a dialog prompt to the user
        // now = new Date().getTime(), //don't know if this needs to get any fancier, since we're using tokens and I'm reauthing on every routChangeSuccess, which includes every page reload
        // expiryTime = now + timeoutLength,
        // warningTime = now + warningLength,       
        warningPromise,
        timeoutPromise;

    ////////////

    //This is our generic service for handling timeouts. There is a fundamental design issue here (very late in app development), which is that trying to do just about anything in other services, adding other service dependencies here, and not relying on event broadcasts fails, because there are lots of dependencies tied to $http, and angular does not allow circular dependencies. Timeout extension is kicked off in the AuthInterceptor service (logically, becuase it's already setup to inspect every request and response), and that's where the $http dependency chain problem begins.

    //Anyway, this service therefore relies on $rootScope.$broadcast of the two user timeout events, one for warning and one to actually kick off logout (which must be handled by another service that already has a dependency on the DataSvc [and therefore $http])

    function setUserTimeout() { //this establishes the timeout and warning. it is first called below on the loginEvent, which is broadcast from the login controller, then called again each time there's a successful call to a service, by way of the extendUserTimeout function, which cancels the old timeouts and sets them up again
      $timeout.cancel(warningPromise);
      $timeout.cancel(timeoutPromise);
      warningPromise = $timeout(function() {
        $rootScope.$broadcast('timeoutWarning', remainingTime.toString()); //this will be used in the rsApp controller to throw the warning dialog
      }, timeToWarning);
      timeoutPromise = $timeout(function() {
        $rootScope.$broadcast('runTimeout'); //this is intercepted by the authentication service, which then calls the DataSvc's session reauth, which at this time should return a 419. That already triggers a logout with a timeout message, so all handled already.
      }, timeoutLength);
      $log.debug(warningPromise);
      $log.debug(timeoutPromise);
    }

    function cancelUserTimeout() {
      $timeout.cancel(warningPromise);
      $timeout.cancel(timeoutPromise);
      $rootScope.$broadcast('timeoutExpired');
    }

    $rootScope.$on('loginEvent', setUserTimeout);

    /////////////

    return service; //return the service

  }

}());
