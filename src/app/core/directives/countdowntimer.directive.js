/*jshint sub: true*/
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:CountdownTimerDirective
 * @description
 * # CountdownTimer
 * Directive of the riskShareApp
 */

 //This is a directive that is unfortunately tied directly to ngDialog. Patterns for getting dynamic values into nested directive and then compliling those nested directives against scope so data could be updated (the timer incremented), just wasn't working for me as I'd hoped. By putting an element (span) with a class of "time-placeholder" inside the directive element (the dialog's full body text), I am able to update that span's DOM. If I try to have the directive on the span, this fails. That would have been a more reusable option. Also, I'm listening here for dialog close because the element itself is not destroyed on dialog close. Therefore I'm triggering destroy and using that handler to cancel the interval (timer).

 //The timer is initially set in the controller and the countdown handled inside the directive.

(function () {

  angular.module('riskShareApp')
    .directive('countdownTimer', ['$log', '$timeout', '$interval', '$rootScope', countdownTimerDirective]);

  //just watch inputs with this directive, optionally binding to the event specified in watchInputBind (probably blur)
  function countdownTimerDirective($log, $timeout, $interval, $rootScope) {
    return {
      restrict: 'A',
      link: function($scope, $element, $attrs, ngModelCtrl) { //element inside this directive refers to the ngDialog's body text/html. It will be destroyed and the timer cancelled every time the dialog is closed. It's recreated every time the dialog is opened.
        var minutes = parseInt($attrs.countdownTimer, 10),
            seconds = 59,
            intervalFn;

        $log.debug('values inside the countdownTimer link function');
        $log.debug(minutes);
        $log.debug($scope);

        // $timeout(function() {
        //   angular.element('.time-placeholder').text(padZeros(minutes) + ':00');
        // }, 0);
        //this is now being handled in the controller that spawns the dialog, as it's not working within the directive
        minutes--; //decrement minutes right after setting initial value of the timer

        intervalFn = $interval(function(){
          updateTimer(); //update the DOM
        }, 1000);

        // $scope.$watch($attrs.countdownTimer, function(value) {
        //   updateTimer();
        // });

        $element.on('$destroy', function() {
          $interval.cancel(intervalFn);
        });

        $scope.$on('ngDialog.closed', function(event, $dialog) {
          $element.trigger('$destroy');
          //$interval.cancel(intervalFn);
        });

        function updateTimer() {
          var decrementSeconds = true,
              secondsBeforeUpdate = seconds,
              outputSeconds = seconds,
              outputMinutes = minutes;

          if (minutes < 10) {
            outputMinutes = padZeros(minutes);
          }
          if (seconds < 10) {
            outputSeconds = padZeros(seconds);
          }
          if (minutes > 0) {
            //$log.debug($thisEl.text());
            //$element.text(outputMinutes + ':' + outputSeconds);
            angular.element('.time-placeholder').text(outputMinutes + ':' + outputSeconds);
            //$log.debug($thisEl.text());
          } else {
            //$element.text('00:' + outputSeconds);
            angular.element('.time-placeholder').text('00:' + outputSeconds);
          }
          if (seconds === 0 && minutes > 0) {
            seconds = 59; //reset seconds to 59
            decrementSeconds = false;
          }
          if (seconds >= 1 && decrementSeconds) {
            seconds--; //decrement seconds every second
          }
          if (minutes >= 1 && secondsBeforeUpdate === 0) {
            minutes--; //decrement minutes by one
          }
          if (minutes === 0 && seconds === 0) {
            $timeout(function() {
              angular.element('.time-placeholder').text('00:00');
              //$rootScope.$broadcast('runTimeout'); //Shouldn't really have to call this from here
            }, 1000);
            $interval.cancel(intervalFn);
          }
        }

        function padZeros(value) {
          return '0' + value;
        }
      }
      
    };

  }

}());
