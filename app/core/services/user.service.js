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
    .module('services.core.User', [])
    .factory('UserSvc', UserSvc);

  UserSvc.$inject = ['$http', '$log', '$q', '$window', '$rootScope', '$timeout', '$location', 'API_URL', 'USER_STORE_PREFIX'];

  function UserSvc($http, $log, $q, $window, $rootScope, $timeout, $location, API_URL, USER_STORE_PREFIX) {

    var store = $window.localStorage;

    var service = {
      getUser: getUser,
      setUser: setUser,
      getUserId: getUserId,
      getUserFirstName: getUserFirstName,
      checkUserIdIsSet: checkUserIdIsSet,
      getPasswordIsSet: getPasswordIsSet,
      getUserRoles: getUserRoles,
      addUserRole: addUserRole,
      removeUserRole: removeUserRole,
      getSecQAIsSet: getSecQAIsSet,
      getSyncSecQANotSet: getSyncSecQANotSet,
      getSyncMustChangePass: getSyncMustChangePass,
      getAcctStatus: getAcctStatus,
      setUserKey: setUserKey,
      routeToHome: routeToHome
    };

    // angular.element(window).on('storage', function(event) {
    //   //if(!$rootScope.$$phase) {
    //     $rootScope.$apply(); //trigger a digest so that controllers can respond to value updates
    //   //}
    // });

    return service;

    function routeToHome() {
      var originalRoles = [];
      getUser('originalRoles').then(function(roles){
        if (roles) {
          if (angular.isString(roles)) {
            originalRoles = angular.fromJson(roles);
          }
          if (angular.isArray(roles)) {
            originalRoles = roles;
          }
        }
      }, function(reason){
        $log.debug('originalRoles not (yet) set ... move on');
      });
      getUserRoles().then(function(rolesArr){
        if (originalRoles.length > 1) {
          rolesArr = originalRoles;
        }
        if (rolesArr.length > 1) { //go to splitter page if the user has more than one role
          goToPath('/home');
        } else { //determine where to go based on role
          var role = rolesArr[0];
          switch (role) { //divert the first route based on role
            case 'ext.ProvContact':
              goToPath('/reports/view');
              break;
            case 'int.Viewer':
              goToPath('/reports/select-contact');
              break;
            case 'int.ReportAdmin':
              goToPath('/reports/manage');
              break;
            case 'int.PreAdmin':
              goToPath('/entities/search');
              break;
            default:
              $location.path('/error');
          }
        }
        if(!$rootScope.$$phase) {
          $rootScope.$apply(); //trigger a digest so that controllers can respond to value updates
        }
        function goToPath(thisPath) {
          if ($location.path() !== (thisPath)) {
            $location.path(thisPath);
          }
        }
      }, function(reason){
        $log.error('issue getting user roles in getHomePath method of UserSvc');
      });
    }

    function setUser(userObj) { //setUser either gets an object on authentication or is used to essentially 'reset' the user if there is no object passed (clears out localStorage)
      var deferred = $q.defer();

      if (userObj) {
        for (var userProp in userObj) {
          if (angular.isObject(userObj[userProp])) { //need to stringify arrays and plain objects for localStorage
            store.setItem(USER_STORE_PREFIX + userProp, angular.toJson(userObj[userProp]));
          } else {
            $log.debug(USER_STORE_PREFIX + userProp + ', ' + userObj[userProp]);
            store.setItem(USER_STORE_PREFIX + userProp, userObj[userProp]);
            //TODO - JSON parse objects in the store before setting on the user object
            //or is this done?
          }
          //}
        }
      } else {
        for (var prop in store) {
          if (prop.indexOf(USER_STORE_PREFIX) > -1) {
            store.removeItem(prop);
          }
        }
      }

      deferred.resolve();
      return deferred.promise;
    }

    function setUserId(id) {
      var deferred = $q.defer();
      if (id) {
        store.setItem(USER_STORE_PREFIX + 'userId', id);
      } else {
        store.removeItem(USER_STORE_PREFIX + 'userId');
      }
      deferred.resolve();
      return deferred.promise;
    }

    function getUser(key) { //TODO - maybe rewrite this to try to get from lS and do GET if not available
      var deferred = $q.defer();
      var storageVal = store.getItem(USER_STORE_PREFIX + key);
      $log.debug('the value of the key requested using getUser() is: ' + storageVal);

      if (angular.isUndefined(key) || key === '') { //if there's just a request for the whole user object
        var userObj = {}; //reconstruct it from localStorage
        for (var i = 0; i < localStorage.length; i++) {
          var userItemKey = localStorage.key(i);
          var userItem = localStorage.getItem(localStorage.key(i));
          userObj[userItemKey] = userItem;
        }
        deferred.resolve(userObj);
      } else if (!angular.isUndefined(store[USER_STORE_PREFIX + key])) {
        var returnVal = store.getItem(USER_STORE_PREFIX + key);
        deferred.resolve(returnVal);
        $log.debug('INSIDE USER SVC GETUSER WITH KEY, RETURNED VALUE IS: ' + returnVal);
      } else {
        //TODO - decide if we should call another service that re-fetches the user data
        deferred.reject('There is no such value in localStorage for the user');
      }

      return deferred.promise;
    }

    function setUserKey(key, value) {
      var deferred = $q.defer();
      $timeout(function(){
        if (angular.isUndefined(key) || key === '') { //if there's just a request for the whole user object
          deferred.resolve(false);
          return false;
        } else if (!angular.isUndefined(value) && value !== '') {
          if (angular.isArray(value)) {
            value = angular.toJson(value);
          }
          store.setItem(USER_STORE_PREFIX + key, value);
          deferred.resolve(value);
          // if(!$rootScope.$$phase) {
          //   $rootScope.$apply(); //trigger a digest so that controllers can respond to value updates
          // }
          $rootScope.$broadcast('storageValueSet');
        } else if (angular.isUndefined(value) || value === '') {
          store.removeItem(USER_STORE_PREFIX + key);
          deferred.resolve(true);
        }
      });
      return deferred.promise;
    }


    function getUserId() {
      return getUser('userId');
      // var deferred = $q.defer();
      // if (getUser('userId') !== undefined) {
      //   var userId = getUser('userId');
      //   deferred.resolve(userId);
      // } else {
      //   $log.error('could not get username from the store');
      //   deferred.reject('could not get username from the store');
      // }
      // return deferred.promise;
    }

    function getUserFirstName() {
      return getUser('firstName');
      // var deferred = $q.defer();
      // if (getUser('firstName') !== undefined) {
      //   var firstName = getUser('firstName');
      //   deferred.resolve(firstName);
      // } else {
      //   $log.error('could not get username from the store');
      //   deferred.reject('could not get username from the store');
      // }
      // return deferred.promise;
    }

    function getSecQAIsSet() {
      var deferred = $q.defer();
        getUser('securityQASet').then(function(secQAIsSet){
          $log.debug('INSIDE USER SVC, response true is: ' + (secQAIsSet === 'true'));
          if (secQAIsSet === 'true') { //check for 'true' string
            deferred.resolve(true);
          } else {
            deferred.resolve(false);
          }
        }, function(reason){
          deferred.reject('couldn\'t determine whether security Q and A were set');
        });

      // var deferred = $q.defer();
      // if (getUser('securityQASet') !== undefined) {
      //   var securityQASet = getUser('securityQASet');
      //   deferred.resolve(securityQASet);
      // } else {
      //   $log.error('could not get security Q&A status from the store');
      //   deferred.reject('could not get security Q&A status from the store');
      // }

      return deferred.promise;
    }

    function getAcctStatus() {
      return getUser('acctStatus');
      // var deferred = $q.defer();
      // if (getUser('acctStatus') !== undefined) {
      //   var acctStatus = getUser('acctStatus');
      //   deferred.resolve(acctStatus);
      // } else {
      //   $log.error('could not get account status from the store');
      //   deferred.reject('could not get account status from the store');
      // }
      // return deferred.promise;
    }

    function getSyncSecQANotSet() {
      return store.getItem(USER_STORE_PREFIX + 'securityQASet') === 'false';
    }

    function getSyncMustChangePass() {
      return store.getItem(USER_STORE_PREFIX + 'acctStatus') === 'FRC';
    }

    function getPasswordIsSet() {
      var deferred = $q.defer();
      $timeout(function(){
        getUser('acctStatus').then(function(response){
          deferred.resolve(response === 'ACT');
        }, function(reason){
          deferred.reject('Account status is not ACT');
        });
      });
      return deferred.promise;
    }

    function getUserRoles() {
      var deferred = $q.defer();
      if (getUser('roles') !== undefined) {
        var rolesArr = [];
        getUser('roles').then(function(response) {
          var roles = angular.fromJson(response);
          angular.forEach(roles, function(role, key) {
            rolesArr.push(role); //don't lowercase these here - do as needed elsewhere
          });
          var stripInvalidRolesArr = stripInvalidRoles(rolesArr); //For MVP, we are not dealing with multiple user roles. This is just security against anyone setting multiple roles in webauth
          deferred.resolve(stripInvalidRolesArr);
        }, function(reason) {
          deferred.reject('could not get or parse user roles object using getUser(roles)');
        });
      } else {
        deferred.reject('could not get user roles from the store');
      }
      return deferred.promise;
    }

    function removeUserRole(roleToRemove) {
      getUserRoles().then(function(rolesArray){
        var roleExists = false;
        angular.forEach(rolesArray, function(role, key){
          // $log.debug('::::::::::::::::::ROLES ARRAY INSIDE REMOVEUSERROLE');
          // $log.debug(rolesArray);
          if (roleToRemove === role) {
            roleExists = true;
            if (rolesArray.length === 1) {
              rolesArray.splice(0, 1);
            } else {
              rolesArray.splice(key, 1);
            }
          }
        });
        // $log.debug(':::::::::::::::::::ROLES ARRAY AFTER REMOVAL');
        // $log.debug(rolesArray);
        if (roleExists) {
          setUserKey('roles', angular.toJson(rolesArray));
        }
      });
    }

    function addUserRole(roleToAdd) {
      getUserRoles().then(function(rolesArray){
        // $log.debug('::::::::::::::::::::ROLES ARRAY INSIDE ADDUSERROLE');
        // $log.debug(rolesArray);
        var roleNotDupe = true;
        angular.forEach(rolesArray, function(role, key){
          if (roleToAdd === role) {
            roleNotDupe = false;
          }
        });
        if (roleNotDupe) {
          rolesArray.push(roleToAdd);
          setUserKey('roles', angular.toJson(rolesArray));
        }
        // $log.debug('::::::::::::::::::::ROLES ARRAY AFTER ADDITION');
        // $log.debug(rolesArray);
      });
    }

    function stripInvalidRoles(rolesArr) { //For MVP, we are not dealing with multiple user roles. This is just security against anyone setting multiple roles in webauth
      angular.forEach(rolesArr, function(role, key) {
        //$log.debug('THESE ARE THE USER ROLES INSIDE STRIPINVALIDROLES');
        //$log.debug(rolesArr);
        if (role !== 'int.Viewer' && role !== 'int.ReportAdmin' && role !== 'ext.ProvContact' && role !== 'int.PreAdmin') {
          rolesArr.splice(key, 1); //remove any roles we just don't support or don't envision supporting
        }
        if (role === 'int.Viewer') {
          rolesArr.splice(key, 1); //remove the roles we aren't currently supporting
        }
      });
      //$log.debug('THESE ARE THE USER ROLES AFTER STRIPPING');
      //$log.debug(rolesArr);
      return rolesArr;
    }

    function checkUserIdIsSet() {
      var deferred = $q.defer();
      getUserId().then(function(userId) {
        var hasId = (userId !== undefined && userId !== '');
        deferred.resolve(hasId);
      }, function(reason){
        deferred.reject('userId could not be obtained using getUserId function for reason: ' + reason);
      });
      return deferred.promise;
    }

  }

}());
