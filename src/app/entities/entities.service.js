'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:entities
 * @description
 * # Entities
 * Service of the riskShareApp
 */

(function(){

  angular
    .module('services.Entities', ['angularUtils.directives.dirPagination'])
    .factory('EntitiesSvc', EntitiesSvc);

  EntitiesSvc.$inject = ['$rootScope', '$q', '$log', 'DataSvc', '$location'];

  function EntitiesSvc($rootScope, $q, $log, DataSvc, $location) {

    var service = {
      getPres: getPres,
      returnToSearch: returnToSearch
    };

    return service;

    ////////////

    function getPres(user) {
      if (user) {
        DataSvc.request('GET', 'pres').then();
      }
    }

    function returnToSearch() {
      var returnSearchObj = $location.search(),
          searchUrl = '/entities/search/?',
          index = 0;
      angular.forEach(returnSearchObj, function(value, prop) {
        //$log.debug(prop, value);
        //$log.debug(prop.indexOf('search_') > -1);
        if (prop.indexOf('search_') > -1) { //look for query params prefixed by 'search_'
          var thisProp = prop.substring(7), //strip off the string 'search_'
              addPropString = thisProp + '=' + value;   
          //$log.debug(thisProp);
          if (index === 0) {
            searchUrl += addPropString;
          }
          if (index > 0) {
            searchUrl += '&' + addPropString;
          }          
          index++; //increment the index variable, only if this is a search property
        }
      });
      $log.debug(searchUrl);
      $location.url(searchUrl);
    }

  }

}());
