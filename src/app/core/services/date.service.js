'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:Date
 * @description
 * # Date
 * Service of the riskShareApp
 */

(function() {

  angular
    .module('services.core.Date', [])
    .factory('DateSvc', DateSvc);

  DateSvc.$inject = ['$log', '$q', '$timeout', '$filter'];

  function DateSvc($log, $q, $timeout, $filter) {

    var service = {
      getFromMonthList: getFromMonthList,
      getCurrentReportDate: getCurrentReportDate,
      setCurrentReportDate: setCurrentReportDate,
      getEarliestReportDate: getEarliestReportDate,
      setToMonthList: setToMonthList,
      getToMonthList: getToMonthList,
      getMonthNumber: getMonthNumber,
      padMonth: padMonth,
      addSpaceYYYYMM: addSpaceYYYYMM,
      stripLeadingZero: stripLeadingZero,
      outputFriendlyYYYYMM: outputFriendlyYYYYMM
    },
        date = new Date(),
        day = date.getDate(),
        month = date.getMonth() + 1,
        year = date.getFullYear(),
        // for testing
        // day = 31,
        // month = 7,
        // year = 2015,
        // for testing
        toMonthList = [],
        fromMonthList = getFromMonthList(),
        currentReportDate = month + '/' + year;

    return service;

    function addSpaceYYYYMM(date) {
      var spacedDate = date.slice(0,4) + ' ' + date.slice(4);
      return spacedDate;
    }

    function getJSDateTime(date) {
      var dateArr = date.indexOf('/') > -1 ? date.split('/') : date.indexOf('-') > -1 ? date.split('-') : date.split(' '),
          month = dateArr[0].length === 4 ? dateArr[1] : dateArr[0],
          year = dateArr[0].length === 4 ? dateArr[0] : dateArr[1];
      month -= 1; //back-tick the month to be zero-based
      $log.debug('date is:: ' + year + ', ' + month);
      var dateTime = new Date(year, month);
      return dateTime;
    }

    function outputFriendlyYYYYMM(date) {
      if ( date.indexOf(' ') === -1 && date.indexOf('/') === -1 && date.indexOf('-') === -1 ) {
        date = addSpaceYYYYMM(date);
      }
      var dateTime = getJSDateTime(date),
          //dateTime = getJSDateTime(parsedDate),
          filteredDate = $filter('date')(dateTime, 'MMM yyyy');
      //$log.debug('SPACED DATE ' + spacedDate);
      //$log.debug('FILTERED DATE ' + filteredDate);
      return filteredDate;
    }

    function padMonth(num, size) {
      var numString = num + '';
      while (numString.length < size) {
        numString = '0' + numString;
      }
      return numString;
    }

    function getMonthNumber(monthname) { //month is passed in as a string, returns a number
      var monthNumber = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(monthname.toLowerCase()) + 1;

      //monthNumber = padMonth(monthNumber, 2); //do not do this prematurely - might actually need to strip leading zeroes

      return monthNumber;
    }

    function getFromMonthList() {

      var returnArray = [],
          earliestMonthLength = getEarliestReportDate().indexOf('/'),
          currentMonthLength = getCurrentReportDate().indexOf('/'),
          beginningMonth = parseInt(getEarliestReportDate().slice(0, earliestMonthLength), 10), 
          beginningYear = parseInt(getEarliestReportDate().slice(earliestMonthLength + 1), 10),
          endMonth = parseInt(getCurrentReportDate().slice(0, currentMonthLength), 10),
          endYear = parseInt(getCurrentReportDate().slice(currentMonthLength + 1), 10),
          secondYear = beginningYear + 1,
          thirdYear = secondYear + 1;

          $log.debug(beginningMonth + ', ' + beginningYear + ', ' + endMonth + ', ' + endYear);

      var monthsInBeginningYear = (12 - beginningMonth),
          monthsInSecondYear = (18 - monthsInBeginningYear) > 12 ? 12 : (18 - monthsInBeginningYear),
          monthsInThirdYear = 18 - monthsInSecondYear - monthsInBeginningYear;

      for (var firstYearMonthTick = 0; firstYearMonthTick < monthsInBeginningYear; firstYearMonthTick++) {
        returnArray.push((beginningMonth + firstYearMonthTick + 1) + '/' + beginningYear); //pad the months by one to account for the difference between the month number and the result of 12 - the month (eg, Sept is 9th and the 4th month from the end of the year, but 12 - 9 is 3)
      }

      for (var secondYearMonthTick = 0; secondYearMonthTick < monthsInSecondYear; secondYearMonthTick++) {
        returnArray.push((1 + secondYearMonthTick) + '/' + secondYear);
      }

      if (monthsInThirdYear > 0) {
        for (var thirdYearMonthTick = 0; thirdYearMonthTick < monthsInThirdYear; thirdYearMonthTick++) {
          returnArray.push((1 + thirdYearMonthTick) + '/' + thirdYear);
        }
      }

      $log.debug('returnArray from getFromMonthList');
      $log.debug(returnArray);
      fromMonthList = returnArray;
      return returnArray.reverse();

    }

    function setCurrentReportDate(newVal) {
      var deferred = $q.defer();
      $timeout(function(){
        if (newVal) {
          var newCurrentMonthArray = newVal.split('/');
          month = newCurrentMonthArray[0];
          year = newCurrentMonthArray[1];
          currentReportDate = newVal;
          deferred.resolve(newVal);
        } else {
          month = date.getMonth() + 1;
          year = date.getFullYear();
          currentReportDate = month + '/' + year;
          deferred.resolve(currentReportDate);
        }
      });
      return deferred.promise;
    }

    function getCurrentReportDate() {
      return currentReportDate ? currentReportDate : month + '/' + year;
    }

    function getEarliestReportDate() { //return 18 months ago
      var monthVar,
          yearVar;
      if (month >= 7) {
        monthVar = month - 6;
        yearVar = year - 1;
      } else {
        monthVar = (month - 6) + 12;
        yearVar = year - 2;
      }
      return monthVar + '/' + yearVar;
    }

    function setToMonthList(selectedFromDate) {
      var deferred = $q.defer();
      $timeout(function(){
        var noLeadingZeroSelectedFromDate = stripLeadingZero(selectedFromDate);
        $log.debug('selected from date: ' + selectedFromDate);
        var posInFromMonthArr = fromMonthList.indexOf(selectedFromDate) === -1 ? fromMonthList.indexOf(noLeadingZeroSelectedFromDate) : fromMonthList.indexOf(selectedFromDate);
        toMonthList = fromMonthList.slice(0, (posInFromMonthArr + 1));
        $log.debug('position of selected month in from list: ' + posInFromMonthArr);
        deferred.resolve(toMonthList);
      });
      return deferred.promise;
    }

    function getToMonthList() {
      return toMonthList;
    }

    function lastDayOfMonth(month, year) {
      return new Date(year, month, 0).getDate();
    }

    function stripLeadingZero(dateString) {
      if (dateString.charAt(0) === '0') {
        return dateString.slice(1);
      }
    }

  }

}());
