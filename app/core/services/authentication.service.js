'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:authentication
 * @description
 * # Authentication
 * Service of the riskShareApp
 */

(function() {

  angular
    .module('services.core.Authentication', [])
    .factory('AuthenticationSvc', AuthenticationSvc);

  AuthenticationSvc.$inject = ['UserSvc', 'AuthInterceptorSvc', 'DataSvc', 'TimeoutSvc', 'ngDialog', 'USER_STORE_PREFIX', 'APP_STORE_PREFIX', 'API_URL', '$http', '$window', '$location', '$rootScope', '$timeout', '$q', '$log'];

  function AuthenticationSvc(UserSvc, AuthInterceptorSvc, DataSvc, TimeoutSvc, ngDialog, USER_STORE_PREFIX, APP_STORE_PREFIX, API_URL, $http, $window, $location, $rootScope, $timeout, $q, $log) {

    var store = $window.localStorage,
      hasStorage = $window.localStorage !== undefined,
      service = {
        login: login,
        logout: logout,
        setSession: setSession,
        removeSession: removeSession,
        clearAll: clearAll,
        setLoggedIn: setLoggedIn,
        getIsLoggedIn: getIsLoggedIn,
        updatePassword: updatePassword,
        updateSecurityQuestion: updateSecurityQuestion
      };

    return service;

    ////////////

    function setSession() {
      var deferred = $q.defer();
      if (hasStorage) {
        //this gets hit first on login
        $log.debug('I am now setting session (step 2)');
        setLoggedIn(true).then(function(boolResp) { //boolResp is returned from the promise after setting isLoggedIn flag in local storage
          if (boolResp) {
            deferred.resolve('we have set the localStorage value of isLoggedIn');
          } else {
            deferred.reject('failed to set session in local storage');
            //handler
          }
        }, function() {
          $log.error('something bad happened trying to set logged-in state');
        }); //sets logged in state on localStorage using user service
      }

      return deferred.promise;
    }

    function removeSession() {
      setLoggedIn(false).then(function(){
        logout();
      }, function(){
        $log.error('problem removing session (changing loggedIn status and logging out)');
      });
    }

    function clearAll() { //this is used in the login route's resolve function, and returns the value of the logged in key in localStorage
      var deferred = $q.defer();

      removeSession();
      AuthInterceptorSvc.setToken();
      deferred.resolve(getIsLoggedIn());

      return deferred.promise;
    }

    // function logout() { //old version
    //   AuthInterceptorSvc.setToken();
    //   removeSession();
    //   $location.path('/login');
    // }

    function login(username, password) {
      var deferred = $q.defer();

      var dataObj = {
        'username': username,
        'password': password
      };

      //DataSvc.user.Login.save(dataObj, function(){});
      DataSvc.session.login(dataObj).success(successFn).error(errorFn);
      // DataSvc.request('POST', 'login', {
      //   'username': username,
      //   'password': password
      // }).success(successFn).error(errorFn);

      function successFn(data, status, headers) { //the success function for login
        var errorInResponse = false;
        for (var prop in data) {
          if (prop.indexOf('error') > -1) {
            errorInResponse = true;
          }
        }
        if(status === 200 && !errorInResponse) {
          var respHeaders = headers(); //call to unwrap the headers object
          AuthInterceptorSvc.setToken(respHeaders.token); //set the header token on login only. It may be overwritten by the Interceptor itself on response when we implement the back-end
          UserSvc.setUser(data); //see setUser function for iterating ofer the user object to populate the user
          $log.debug('successful login (this should be the 1st step): ');
          $log.debug(data);
          $rootScope.$broadcast('loginSuccess');
          deferred.resolve(data);
        } else {
          deferred.reject('There is a login problem'); //TODO - get the correct message from the data and use to update messages - but
          //do this in authinterceptor getResponse
        }
      }

      function errorFn(reason) {
        $log.debug('error: ' + reason);
        deferred.reject('error: ' + reason);
      }

      return deferred.promise;

    }

    //the logout routine
    function logout() {
      //DataSvc.request('GET', 'logout').success(successFn).error(errorFn);
      //TODO - wrap the rest of the logout steps in the successFn of hitting the server's 'logout' endpoint

      //DataSvc.request('GET', 'logout').success(successFn).error(errorFn);
      DataSvc.session.logout().then(successFn, errorFn);

      function successFn(success) {
        clientLogout(true).then(function(response){
          $rootScope.$broadcast('logoutSuccess');
          $log.debug('client and server successfully logged out');
        }, function(reason){
          $log.error('server successfully logged out, but client did not');
        });
      }

      function errorFn(error) {
        clientLogout(false).then(function(response){
          $log.error('client successfully logged out, but server did not');
          $log.error(error);
        }, function(reason){
          $log.error('neither client nor server successfully logged out');
          $log.error(error);
        });
      }

      function clientLogout(bool) {
        var deferred = $q.defer();
        TimeoutSvc.cancelUserTimeout();
        $timeout(function(){
          AuthInterceptorSvc.setToken(); //clears the token
          UserSvc.setUser(); //clear out the user
          for (var prop in store) {
            if (prop.indexOf(APP_STORE_PREFIX) > -1) {
              store.removeItem(prop); //clears all other localStorage for this app on this domain
            }
          }
          $location.url('/login').replace();
          $rootScope.$apply();
          deferred.resolve('client logged out successfully:: ' + bool);
        }, 0);
        return deferred.promise;
      }

    }

    function setLoggedIn(bool) {
      var deferred = $q.defer();
      if (bool) { //check if the bool is set to true or defined at all
        store.setItem(USER_STORE_PREFIX + 'isLoggedIn', bool);
      } else { //otherwise remove the key
        store.removeItem(USER_STORE_PREFIX + 'isLoggedIn');
      }
      deferred.resolve(getIsLoggedIn());
      return deferred.promise;
    }

    function getIsLoggedIn() {
      if (!angular.isUndefined(store[USER_STORE_PREFIX + 'isLoggedIn'])) {
        if (store.getItem(USER_STORE_PREFIX + 'isLoggedIn') === 'true') {
          $log.debug('ACCORDING TO AUTH SVC, USER IS LOGGED IN: TRUE');
          return true;
        }
      }
      $log.debug('ACCORDING TO AUTH SVC, USER IS NOT LOGGED IN');
      return false;
    }

    function updatePassword(oldPass, newPass, verifyPass) {
      var passwordObj = {
        'oldPass': oldPass,
        'newPass': newPass,
        'verifyPass': verifyPass
      };

      //console.log(passwordObj);
      //DataSvc.session.password(passwordObj);

      // TODO: success and error
      return DataSvc.session.password(passwordObj); //chain this promise in the calling controller(s)

      //function successFn(success) {
        //console.log('success function in auth service fired');
      //}
      //function errorFn(success) {
        //console.log('error function in auth service fired');
      //}
    }

    function updateSecurityQuestion(question, answer) {
      var securityQuestionObj = {
        'question': question,
        'answer': answer
      };
      //console.log('hit AuthenticationSvc');
      return DataSvc.session.setQuestion(securityQuestionObj);
    }

    //Listen for the logout call from the TimeoutSvc (cannot add this service as a dependency of that one, because of a circularity of dependencies)
    $rootScope.$on('runTimeout', function() { //this is triggered from the TimeoutSvc, currently, at just over 30 mins without a service call (or new token being issued)
      DataSvc.session.reauth();
    });

  }

}());
