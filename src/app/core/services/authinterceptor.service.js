'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:authInterceptor
 * @description
 * # authInterceptor
 * Service of the riskShareApp
 */


/**
 *This is a generic interceptor service that also references the AuthToken service, where we handle the
 *authorization token. There are 4 major handlers: getRequest, getRequestError, getResponse, and getResponseError.
 *We alias these with the angular-specific methods request, requestError, response, and responseError.
 *There is an added method "requiresAuth" which checks whether the next route requires authorization.
 *The MessagesSvc service is referenced to handle registration of errors, and a $rootScope brodacast is being
 *used to send out the message that errors have been updated, for the messages controller to react to by *displaying error messages.
 *TODO - I have yet to implement role-specific, request-specific handling (for AJAX)
 */

(function() {

  angular
    .module('services.core.AuthInterceptor', [])
    .factory('AuthInterceptorSvc', AuthInterceptorSvc);

  AuthInterceptorSvc.$inject = ['$q', '$location', '$rootScope', '$log', '$window', 'MessagesSvc', 'USER_STORE_PREFIX', 'API_URL', 'TimeoutSvc'];

  function AuthInterceptorSvc($q, $location, $rootScope, $log, $window, MessagesSvc, USER_STORE_PREFIX, API_URL, TimeoutSvc) {

    var store = $window.localStorage,
      tokenKey = USER_STORE_PREFIX + 'auth-token',
      service = {
        request: getRequest,
        requestError: getRequestError,
        response: getResponse,
        responseError: getResponseError,
        requiresAuth: requiresAuth,
        getToken: getToken,
        setToken: setToken
      };

    return service;

    ////////////

    function getRequest(config) {
      $log.debug(config);
      if (config.url && config.url.indexOf(API_URL) > -1) { //we only need to send the token on REST API requests
        var token = getToken(); //here is where we add the token bearer header to each request

        if (token) { //once we have the token (ie, after login)
          config.headers = config.headers || {};
          //config.headers.Authorization = 'Bearer ' + token; //this would be the standard, but we are using a custom header, X-Auth-Token
          config.headers['X-Auth-Token'] = token;
        }
      }
      return config;
    }

    function getRequestError(rejection) {
      $log.debug('Request error: ' + rejection);
      return $q.reject(rejection);
    }

    function getResponse(response) {
      //$log.debug('RESPONSE IS:: ');
      //$log.debug(response);
      var responseHeaders = response.headers(),
        infoMsgInResponse = false,
        errorMsgInResponse = false;

      //log.info('Response is: ');
      //$log.debug(response);
      $log.debug('Response status is: ' + response.status);
      //$log.debug('Response data is: ');
      //$log.debug(response.data);

      //$log.debug('HERE ARE THE RESPONSE HEADERS::::::::');
      //$log.debug(responseHeaders);

      parseResponseToken(responseHeaders);

      for (var prop in response.data) {
        //if (prop2.indexOf('info') > -1) {
        if (prop.indexOf('infoMsg') > -1) {
          infoMsgInResponse = true;
        }
        if (prop.indexOf('errorMsg') > -1) {
          errorMsgInResponse = true;
        }
      }

      // response status is always a number, not a string!
      //$log.debug('RESPONSE STATUS CONTAINS 200');
      //$log.debug(response.status === 200); //true
      //$log.debug(response.status === '200'); //false

      if ((response.status >= 200 && response.status < 300) && (infoMsgInResponse || errorMsgInResponse)) {
        if (infoMsgInResponse) {
          MessagesSvc.registerInfoMsg(response.data.infoMsg);
        }
        if (errorMsgInResponse) {
          MessagesSvc.registerErrors(response.data.errorMsg);
        }
      }
      return response || $q.when(response);
    }

    function getResponseError(rejection) {
      //$log.debug('RESPONSE ERROR IS:: ');
      //$log.debug(rejection);
      var rejectionHeaders = rejection.headers();

      // parseResponseToken(responseHeaders); //this should be handled in the response interceptor only

      if (rejection.status >= 400 && rejection.status <= 599) { //TODO - do we need a more authoritative block
        // to prevent further action/routing here?
        $log.error('INSIDE getResponseErrors HERE IS THE RESPONSE ERROR STATUS:: ' + rejection.status);
        $log.error('AND DATA::::::::');
        $log.error(rejection.data);

        if (rejection.status === 419) {
          $location.path('/login').replace();
        }

        MessagesSvc.registerErrors(rejection.data);
      }

      return $q.reject(rejection);
    }

    function requiresAuth(nextRoute) {
      //var authFlag = nextRoute.restricted;
      if (nextRoute !== undefined) {
        if (nextRoute.settings !== undefined) {
          var authFlag = nextRoute.settings.loginRequired;
          return authFlag && authFlag === true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    function getToken() {
      return store.getItem(tokenKey);
    }

    function setToken(token) { //this method sets the token in our store or removes it if there is no token param provided
      try {
        //$log.debug('Inside setToken, the token is:: ' + token);
        if (token && token !== undefined) {
          store.setItem(tokenKey, token);
          TimeoutSvc.setUserTimeout();
        } else if (token === '') {
          store.removeItem(tokenKey);
        }
      } catch (exception) {
        $log.error('There was a problem either setting or clearing the token on the client::' + exception);
      }
    }

    function parseResponseToken(responseHeaders) {
      var token = '';
      for (var header in responseHeaders) {
        //$log.debug('HERE IS EACH HEADER::::::::');
        //$log.debug(header);
        if (header === 'x-auth-token' && responseHeaders[header].length > 0) { //check for the token header and make sure there's something in it
          $log.debug('Response header is:: ' + header);
          token = responseHeaders[header];
          $log.debug(token);
        }
      }
      if (token !== '') {
        //$log.debug('Token is:: ' + token);
        setToken(token); //add the token to localStorage, to be retrieved for the next request using getToken
        $rootScope.$broadcast('tokenUpdate');
      }
    }

  }

}());
