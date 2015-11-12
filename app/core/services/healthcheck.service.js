'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:healthCheck
 * @description
 * # healthCheck
 * Service of the riskShareApp
 */

//All the global stuff that need to happen on route change start and success

(function() {

  angular
    .module('services.core.HealthCheck', [])
    .factory('HealthCheckSvc', HealthCheckSvc);

  HealthCheckSvc.$inject = ['$rootScope', '$log', '$q', 'MessagesSvc', 'AuthenticationSvc', 'DataSvc', 'usSpinnerService'];

  function HealthCheckSvc($rootScope, $log, $q, MessagesSvc, AuthenticationSvc, DataSvc, usSpinnerService) {

    var service = {
      healthCheck: healthCheck
    };

    return service;

    ////////////

    function healthCheck() {
      var deferred = $q.defer(),
          healthCheckArray = [];
      healthCheckArray.push(DataSvc.healthCheck);
      healthCheckArray.push(DataSvc.boeHealthCheck);

      $q.all(healthCheckArray).then(function(responseArray) {
        $log.debug('HEALTHCHECK!!');
        $log.debug(responseArray[0].status);
        $log.debug(responseArray[1].status);
        // test when both checks pass for error message
        // MessagesSvc.registerErrors({
        //   errorMsg: 'Services for this application are currently down. Please check back or contact Moda for support.'
        // }).then(function(response) {
        //   $rootScope.$broadcast('messagesUpdate');
        // });
        deferred.resolve(true);
      }, function(error) {
        var healthErrorMsg;
        $log.error('HEALTHCHECK FAILURE!!!');
        $log.error(error);
        if (!angular.isUndefined(error.errorMsg)) {
          healthErrorMsg = error.errorMsg;
        } else if (error && typeof error === 'string') {
          healthErrorMsg = error;
        } else {
          healthErrorMsg = 'Services for this application are currently down. Please check back or contact Moda for support.';
        }
        if (AuthenticationSvc.getIsLoggedIn()) {
          AuthenticationSvc.logout(); //try doing this here
        }
        MessagesSvc.registerErrors(healthErrorMsg).then(function(response) {
          usSpinnerService.stop('spinner-1');
          //$rootScope.$broadcast('messagesUpdate'); //let this be handled by the MessagesSvc
          $rootScope.$broadcast('serviceAlert'); //need this to control the specific display of a service alert
        });
        deferred.reject(false);
      });

      return deferred.promise; //will return true or false
    }

  }
}());
