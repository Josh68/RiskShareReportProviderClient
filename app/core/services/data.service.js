'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:data
 * @description
 * # Data
 * Service of the riskShareApp
 */

//this is now just a template for a generic data service

(function() {

  angular
    .module('services.core.Data', [])
    .factory('DataSvc', DataSvc);

  DataSvc.$inject = ['$http', '$log', '$q', '$resource', 'API_URL', 'API_PATHS'];

  function DataSvc($http, $log, $q, $resource, API_URL, API_PATHS) {

    var service = {
      request: request, //this is using $http for non-resource requests, like login and logout - don't know if I should refactor more to use $resource, or even if I can
      credentials: credentials(),
      pres: pres(), //each endpoint will have variations that are returned by the enclosing function
      reports: reports(),
      tins: tins(),
      hs: hs(),
      session: session(), //leverages request, above
      healthCheck: healthCheck(),
      boeHealthCheck: boeHealthCheck(),
      Content: $resource(API_URL + API_PATHS.content + '/app_code/:appCode/state/:state/content_type/:contentType')
    };

    return service;

    function credentials() {
	      var dataObj = {
	        ByUsername: $resource(API_URL + API_PATHS.verify + '/username/:username'),
	        VerifyTokenAndUserInfo: $resource(API_URL + API_PATHS.selfRegistration, null, {
	            'verify': {
	              method: 'POST'
	            }
	         }),
	        AccountCreate: $resource(API_URL + API_PATHS.selfRegistrationCreate, null, {
	            'create': {
	              method: 'POST'
	            }
	         }),
	        ResetPassword: $resource(API_URL + API_PATHS.resetPassword, null, {
	            'reset': {
	              method: 'POST'
	            }
	         })
	      };
	      return dataObj;
	    }
    
    function session() {
      var sessionDataObj = {
        login: loginFn,
        logout: logoutFn,
        password: passwordFn,
        setQuestion: setQuestionFn,
        reauth: reauthFn //this is for getting a new token, or will log the user out if they're timed out
      };
      return sessionDataObj;
    }

    function loginFn(userObj) {
      var payload = angular.toJson(userObj);
      return request('POST', 'login', payload);
    }

    function logoutFn(userObj) {
      return request('GET', 'logout');
    }

    function reauthFn() {
      return request('GET', 'reauth');
    }

    function healthCheck() {
      return request('GET', 'healthCheck');
    }

    //mock failed healthCheck
    // function healthCheck() {
    //   var deferred = $q.defer();
    //   deferred.reject({
    //     errorMsg: 'things went wrong',
    //     status: 401
    //   });
    //   return deferred.promise;
    // }

    function boeHealthCheck() {
      return request('GET', 'boeHealthCheck');
    }

    function pres() { //this is my new crazy attempt at defining $resource objects that can be used for specific tasks on resource roots (like /entities/pres)
      var presDataObj = {
        ByUser: $resource(API_URL + API_PATHS.pres + '/user_id/:userId'), //optional params will be in the query string: name=name&associated=bool
        ById: $resource(API_URL + API_PATHS.pres + '/id/:id'),
        FilteredAll: $resource(API_URL + API_PATHS.pres),
        Create: $resource(API_URL + API_PATHS.pres + '/create'),
        EditFromSearch: function(url) {
          return $resource(API_URL + url);
        },
        Save: $resource(API_URL + API_PATHS.pres + '/update/:id', {id: '@id'}, {
          'update': {
            method: 'PUT'
          }
        })
      };
      return presDataObj;
    }

    function hs() {
      var hsDataObj = {
        FilteredAll: $resource(API_URL + API_PATHS.hs), //optional params will be in the query string: name=name&associated=bool&active=bool
        Create: $resource(API_URL + API_PATHS.hs + '/create'),
        ById: $resource(API_URL + API_PATHS.hs + '/id/:id'),
        Save: $resource(API_URL + API_PATHS.hs + '/update/:id', {id: '@id'}, {
          'update': {
            method: 'PUT'
          }
        }),
        EditFromSearch: function(url) {
          return $resource(API_URL + url);
        }
      };
      return hsDataObj;
    }

    function tins() {
      var tinsDataObj = {
        FilteredAll: $resource(API_URL + API_PATHS.tins), //optional params will be in the query string: name=name[or]tin=tin&associated=bool&active=bool
        Create: $resource(API_URL + API_PATHS.tins + '/create'),
        ById: $resource(API_URL + API_PATHS.tins + '/id/:id'),
        Save: $resource(API_URL + API_PATHS.tins + '/update/:id', {
          id: '@id'
        }, {
          'update': {
            method: 'PUT'
          }
        }),

        EditFromSearch: function(url) {
          return $resource(API_URL + url);
        }
      };
      return tinsDataObj;
    }

    function reports() {
      var reportsDataObj = {
        ByUserAndPre: $resource(API_URL + API_PATHS.reports + '/user_id/:userId/pre_id/:preId'), //optional params will be in the query string: date_from: YYYYMM, date_to: YYYYMM, report_names: ['RPT_CODE1', 'RPT_CODE2']
        //the exact spec is TBD
        Types: $resource(API_URL + API_PATHS.reportTypes),
        Manage: $resource(API_URL + API_PATHS.reports),
        Codes: $resource(API_URL + API_PATHS.reportCodes),
        SetStatus: $resource(API_URL + API_PATHS.reportsUpdate, null, {
          'update': {
            method: 'PUT'
          }
        })
      };
      return reportsDataObj;
    }

    function request(verb, endpoint, data) { //verb and endpoint are not optional, data and params are
      ///var deferred = $q.defer();

      var args = Array.prototype.slice.apply(arguments),
        urlToSet = endpoint; //set the URL to the endpoint

      //$log.debug('CHECKING THE PATHS INJECTED INTO DATASVC');
      for (var path in API_PATHS) {
        //$log.debug(path);
        //$log.debug(endpoint);
        if (endpoint === path) {
          urlToSet = API_PATHS[endpoint]; //if the endpoint is a static configured path, reset it to that
        }
      }

      var reqConfig = {
        method: verb,
        url: (function() {
          return urlToSet.indexOf(API_URL) > -1 ? urlToSet : API_URL + urlToSet;
        }())
      };

      if (data) {
        reqConfig.data = data;
      }

      // if (params) {
      //   reqConfig.params = params;
      // }

      return $http(reqConfig);
      //return deferred.promise;
    }

    function passwordFn(passwordObj) {
      var payload = angular.toJson(passwordObj);
      return request('POST', 'password', payload);
    }

    function setQuestionFn(securityQuestionObj) {
      var payload = angular.toJson(securityQuestionObj);
      return request('POST', 'setQuestion', payload);
    }

  }

}());
