'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:clearGlobalMessages
 * @description
 * # clearGlobalMessages
 * Directive of the riskShareApp
 */

(function() {

  angular.module('riskShareApp').directive('clearGlobalMessages', ['$log', '$q', '$window', 'USER_STORE_PREFIX', 'MessagesSvc', 'UserSvc', 'CONTENT', clearGobalMessagesDirective]);

  //directive to clear messages in the following scenarios: Route change (but not timeout), form submit, and tab change in report mgmt. Exception for timeout on logout (which routes to Login).

  function clearGobalMessagesDirective($log, $q, $window, USER_STORE_PREFIX, MessagesSvc, UserSvc, CONTENT) {
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs) {
        var eventArray = ['tabSelected', '$routeChangeSuccess'],
            securityIsSet = true,
            qaIncrement = 0,
            store = $window.localStorage,
            preventClearMessages = false;
        $scope.$on('$routeChangeStart', function(event, next, current){
          //use sync getters for this, as the async general method fails for sec Q&A in combination with the routechange events
          var acctNotActive = UserSvc.getSyncMustChangePass(),
              secQANotSet = UserSvc.getSyncSecQANotSet();

          securityIsSet = true; //set this back to true on the beginning of every route change

          if (acctNotActive || secQANotSet) {
            securityIsSet = false; //set to false if either security flow isn't complete on route change start
          }
        });
        angular.forEach(eventArray, function(event, key) {
          $scope.$on(event, function(e, current, previous) {
            //$log.debug('this event is:: ');
            //$log.debug(e);
            var isTimedOut = MessagesSvc.getIsTimeout(); //new method on the Messages service to check for timeout error, inspects the 419 code before it is stripped from the message, so is message independent

            if (!isTimedOut && securityIsSet && !preventClearMessages) { //preventClearMessages will have been set by the form submission that just took place before the route change success. Tab selection is out of scope here
              MessagesSvc.clearAll();
            }

            preventClearMessages = false; //reset this flag for the next event

            MessagesSvc.resetTimeout(); //after the conditional check, make sure to reset the value of isTimeout in the messages service to false
          });
        });
        $element.on('submit', function(event) {
          $log.debug('this is the submit event that clears messages');
          $log.debug(event);
          angular.forEach(CONTENT.userMgmt, function(formId, key) { //All of the form ids for user management are defined in the constants CONTENT.userMgmt object. Iterate thru these and if the event target (form) id is a user mgmt form, don't clear the messages. This stuff is self-registration, self-serve password change, and required update password and security flows
            if (event.target.id === formId) {
              preventClearMessages = true;
            }
          });
          //if (!preventClearMessages) { //don't do this here. instead condition the MessagesSvc.clearAll() function inside the event handler for routeChangeSuccess and tabSelected. RouteChangeSuccess comes after form submission. If you prevent this clearAll from running, messages for user mgmt will stack up one on top of another.
            MessagesSvc.clearAll();
          //}
        });
      }
    };
  }

}());
