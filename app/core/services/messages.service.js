'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:messages
 * @description
 * # Messages
 * Service of the riskShareApp
 */

(function() {

  angular
    .module('services.Messages', [])
    .factory('MessagesSvc', MessagesSvc);

  MessagesSvc.$inject = ['$rootScope', '$q', '$log', 'UtilsSvc', 'usSpinnerService'];

  function MessagesSvc($rootScope, $q, $log, UtilsSvc, usSpinnerService) {

    var errorsArray = errorsArray || [],
        messagesArray = messagesArray || [],
        isTimeout = false;

    var service = {
      registerErrors: registerErrors,
      getErrors: getErrors,
      resetTimeout: resetTimeout,
      getIsTimeout: getIsTimeout,
      clearAll: clearAll,
      clearInfoMsgs: clearInfoMsgs,
      clearErrors: clearErrors,
      registerInfoMsg: registerInfoMsg,
      getInfoMsg: getInfoMsg
    };

    return service;

    ////////////

    function registerErrors(error) {
      var deferred = $q.defer(),
        errorMsg,
        isErrorObject = angular.isObject(error),
        isErrorMsg = angular.isString(error),
        tempErrorArray = [],
        objectNotError = false;
      //figure out if what's being passed is an error object or a string, and set the new var accordingly
      if (isErrorObject) {
        angular.forEach(error, function(error, key) { //the way we are using this method, there should be only one error
          tempErrorArray.push(error);
        });
        if (tempErrorArray.length === 1) {
          errorMsg = tempErrorArray[0];
        } else {
          objectNotError = true;
          deferred.reject(false); //abort if for some reason there's an object with more than one key/value pair (or nothing) being passed in
        }
      } else if (isErrorMsg) {
        errorMsg = error;
      } else {
        deferred.reject(false);
      }

      $log.debug('HERE\'S AN ERROR MESSAGE IN THE MSGS SVC:: ');
      $log.debug(errorMsg);
      //strip unnecessary text from a 419 or 401 message
      if ( errorMsg.indexOf('419') > -1 || errorMsg.indexOf('401') ) {
        if ( errorMsg.indexOf('419') > -1 ) {
          isTimeout = true;
        } else {
          isTimeout = false;
        }
        errorMsg = fixAuthOrTimeoutMsg(errorMsg);
      }

      //push the message to an array
      if ((isErrorObject || isErrorMsg) && !objectNotError) {
        if (errorsArray.length === 0) {
          errorsArray.push(errorMsg);
        } else {
          angular.forEach(errorsArray, function(value, key) {
            if (errorMsg !== value) {
              errorsArray.push(errorMsg);
            }
          });
        }
      }
      errorsArray = UtilsSvc.deDupe(errorsArray);
      deferred.resolve(errorsArray);
      usSpinnerService.stop('spinner-1');
      $rootScope.$broadcast('messagesUpdate'); //TODO - verify that having a broadcast in the service isn't breaking anything
      return deferred.promise;
    }

    function getErrors() {
      $log.debug('I\'m inside getErrors: ');
      $log.debug(errorsArray);
      return errorsArray;
    }

    function getIsTimeout() {
      return isTimeout;
    }

    function resetTimeout() {
      isTimeout = false;
    }

    function clearAll() {
      //errors
      while (errorsArray.length > 0) {
        errorsArray.pop();
      }
      // infoMsgs
      while (messagesArray.length > 0) {
        messagesArray.pop();
      }
      $rootScope.$broadcast('messagesUpdate');
    }

    function clearErrors() {
      while (errorsArray.length > 0) {
        errorsArray.pop();
      }
      $rootScope.$broadcast('messagesUpdate');
    }

    function clearInfoMsgs() {
      // infoMsg
      while (messagesArray.length > 0) {
        messagesArray.pop();
      }
      $rootScope.$broadcast('messagesUpdate');
    }

    function registerInfoMsg(message) {
      var deferred = $q.defer(),
        infoMsg,
        isInfoObject = angular.isObject(message),
        isInfoMsg = angular.isString(message),
        tempMsgArray = [],
        objectNotMessage = false;

      if (isInfoObject) {
        angular.forEach(message, function(messageVal, key) { //the way we are using this method, there should be only one message
          tempMsgArray.push(messageVal);
        });
        if (tempMsgArray.length === 1) {
          infoMsg = tempMsgArray[0];
        } else {
          objectNotMessage = true;
          deferred.reject(false); //abort if for some reason there's an object with more than one key/value pair (or nothing) being passed in
        }
      } else if (isInfoMsg) {
        infoMsg = message;
      } else {
        deferred.reject(false);
      }


      if ((isInfoObject || isInfoMsg) && !objectNotMessage) {
        if (messagesArray.length === 0) {
          messagesArray.push(infoMsg);
        } else {
          angular.forEach(messagesArray, function(value, key) {
            if (infoMsg !== value) {
              messagesArray.push(infoMsg);
            }
          });
        }
      }
      messagesArray = UtilsSvc.deDupe(messagesArray);
      //deferred.resolve(messagesArray);
      deferred.resolve(message.status);
      usSpinnerService.stop('spinner-1');
      $rootScope.$broadcast('messagesUpdate'); //TODO - verify that having a broadcast in the service isn't breaking anything
      return deferred.promise;
    }

    function getInfoMsg() {
      $log.debug('I\'m inside getInfoMsg: ');
      $log.debug(messagesArray);
      return messagesArray;
    }

    function fixAuthOrTimeoutMsg(msg) {
      var testPattern = /^.+4(?:01|19)[\W\D\S]\s/;
      return msg.replace(testPattern, '');
    }

  }

}());
