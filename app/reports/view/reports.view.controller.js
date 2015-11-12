/* jshint camelcase: false */
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:ReportsViewCtrl
 * @description
 * # Report View
 * Controller of the riskShareApp
 */

(function() {

  angular.module('riskShareAppReports').controller('ReportsViewCtrl', ReportsViewCtrl);

  ReportsViewCtrl.$inject = ['DataSvc', 'DateSvc', 'ReportsSvc', '$log', '$window', '$filter', '$location', '$scope', '$timeout', 'USER_STORE_PREFIX', 'API_URL', 'API_PATHS', 'CONTENT'];

  function ReportsViewCtrl(DataSvc, DateSvc, ReportsSvc, $log, $window, $filter, $location, $scope, $timeout, USER_STORE_PREFIX, API_URL, API_PATHS, CONTENT) {
    var vm = this,
      store = $window.localStorage,
      newReportSelected = false,
      newPreSelected = false,
      newDateSelected = false;

    vm.userId = store.getItem(USER_STORE_PREFIX + 'userId');
    vm.availablePres = [];
    vm.pre = {};
    vm.report = {};
    vm.availableReports = [];
    vm.selectedReportType = 'Clinical';
    vm.selectedReportCode = '';
    vm.reportType = { //we need a selected pre before we can check or uncheck these boxes
      setType: {
        clinical: false,
        financial: false
      },
      hasType: {
        financial: false,
        clinical: false
      },
      testRadioType: ''
    };
    vm.preNotSelected = true;
    vm.noAvailableReports = true;
    vm.dateRange = {
      fromDates: DateSvc.getFromMonthList(),
      toDates: [],
      initialDate: DateSvc.getCurrentReportDate()
    };
    vm.date = {
      from: DateSvc.getCurrentReportDate(),
      to: DateSvc.getCurrentReportDate()
    };
    vm.viewResultsTable = false;
    vm.showNoResults = false;
    vm.submitBinding = false;
    vm.selectableFinReports = [];
    vm.selectableUtilReports = [];
    vm.allSelectableReports = [];
    vm.selectableReports = [];
    vm.reportsPlaceholder = {
      name: CONTENT.reports.view.reportsPlaceholder.name,
      code: CONTENT.reports.view.reportsPlaceholder.code //the logic here is that clinical is always first, and the name is just a placeholder - this will be reset depending on the PRE chosen
    };
    vm.presPlaceholder = CONTENT.reports.view.presPlaceholder;
    vm.chosenPreId = '';

    //get the available pres for the user
    DataSvc.pres.ByUser.get({
      userId: vm.userId
    }, function(presObj) {
      $log.debug('INSIDE REPORTS VIEW CONTROLLER');
      $log.debug(presObj);
      vm.availablePres = angular.isArray(presObj.pres) ? presObj.pres : [];
    });

    //get a list of available reports by type
    DataSvc.reports.Types.get(
      function(reportTypeObj) {
        var returnedReportObj = ReportsSvc.createReportsList(reportTypeObj);
        vm.selectableUtilReports = returnedReportObj.selectableUtilReports;
        vm.selectableFinReports = returnedReportObj.selectableFinReports;
        vm.allSelectableReports = returnedReportObj.allSelectableReports;
      }, function(reason) {
        $log.error('could not get report types/names because of: ');
        $log.error(reason);
      }
    );

    //watch the value of the report dropdown for a selected report and change selected report code accordingly
    $scope.$watch(function() {
      return vm.report.selected;
    }, function(newVal, oldVal) {
      if (newVal && !angular.equals(oldVal, newVal)) {
        newReportSelected = true;
        $log.debug('New Report Selected: ');
        $log.debug(newVal);
        if (newVal.code) {
          vm.selectedReportCode = newVal.code;
          vm.reportsPlaceholder.code = newVal.code; //do this for the submit binding to have knowledge of changes to the reports dropdown, if it isn't still set to 'all available'
        }
      } else {
        newReportSelected = false;
      }
    });

    //watch the binding on the view submit button and do a filtered request to the back-end to get a new list of reports
    $scope.$watch(function() {
      return vm.submitBinding;
    }, function(newVal, oldVal) {
      $log.debug('submit: ' + oldVal + ', ' + newVal);
      if (newVal !== oldVal) { //basically, this is just registering that I've clicked the button again (it's a toggle)
        //$log.debug('STUFF I\'M GATHERING ON CLICKING THE VIEW BUTTON');
        //$log.debug('DateSvc.getCurrentReportDate(): ' + DateSvc.getCurrentReportDate());
        //$log.debug('vm.date.from: ' + vm.date.from);
        //$log.debug('vm.date.to: ' + vm.date.to);

        $log.debug('vm.reportsPlaceholder.code: ' + vm.reportsPlaceholder.code);
        $log.debug('vm.selectableReports[0].code: ' + vm.selectableReports[0].code);
        //if (vm.date.to !== DateSvc.getCurrentReportDate() || vm.date.from !== DateSvc.getCurrentReportDate() || vm.report.selected !== vm.selectableReports[0]) { //need to check from or to date report name selector has changed from default settings
        if (newReportSelected || newPreSelected || newDateSelected) { //this logic is flawed - won't prevent searches when values haven't changed
          $log.debug('vm.date.from:: ' + vm.date.from);
          $log.debug('vm.date.to:: ' + vm.date.to);
          var dateFromArr = vm.date.from.split('/'),
            dateToArr = vm.date.to.split('/'),
            fromDate = dateFromArr[1] + DateSvc.padMonth(dateFromArr[0], 2),
            toDate = dateToArr[1] + DateSvc.padMonth(dateToArr[0], 2),
            reportCodeArr = [],
            finReportCodeArr = [],
            utilReportCodeArr = [];

          //$log.debug('REPORT OBJECTS');
          //$log.debug(vm.selectableUtilReports);
          //$log.debug(vm.selectableFinReports);

          angular.forEach(vm.selectableUtilReports, function(reportObj, key) {
            if (key !== 0) {
              angular.forEach(reportObj, function(value, key) {
                if (key === 'code') {
                  utilReportCodeArr.push(value);
                }
              });
            }
          });

          angular.forEach(vm.selectableFinReports, function(reportObj, key) {
            if (key !== 0) {
              angular.forEach(reportObj, function(value, key) {
                if (key === 'code') {
                  finReportCodeArr.push(value);
                }
              });
            }
          });

          //if the code is all fin, make the array equal all financials, if it's util, make it all clinicals, and otherwise, make it a specific report - this gets used in the subsequent request for reports for the table view
          if (vm.selectedReportCode === 'FIN_ALL') {
            reportCodeArr = finReportCodeArr;
          } else if (vm.selectedReportCode === 'UTIL_ALL') {
            reportCodeArr = utilReportCodeArr;
          } else {
            reportCodeArr.push(vm.selectedReportCode);
          }

          var dataObj = {
            userId: vm.userId,
            preId: vm.chosenPreId,
            date_from: fromDate,
            date_to: toDate,
            report_codes: reportCodeArr
          };

          DataSvc.reports.ByUserAndPre.get(dataObj, function(reportsObj) { //this should always be an array of (emtpy or with results)
            //check whether there are no reports
            reportsObj.reports = angular.isArray(reportsObj.reports) ? reportsObj.reports : [];
            vm.availableReports = reportsObj.reports;
            if (reportsObj.reports.length === 0) {
              vm.showNoResults = true;
              vm.viewResultsTable = false;
            } else {
              angular.forEach(reportsObj.reports, function(report, key) {

                $log.debug(report);

                var downloadUrl = API_URL + report.url;

                report.downloadUrl = downloadUrl + '/?token='; //for downloading reports, we tack on the auth token as a query param -- add the token from the vm value in the view

                report.filteredDate = DateSvc.outputFriendlyYYYYMM(report.date); //before ending the loop, set the date to JS dateTime, for front-end filtering
                //TODO - these mappings aren't correct
                report.pdf = report.type === 'UTIL';
                report.xls = report.type === 'FIN';

                //TODO - see if the code block below needs to remain
                if (!$scope.$$phase) { //check to see that a digest isn't already running
                  $scope.apply(); //if it isn't, trigger using apply (hacky, but works)
                }
              });
              vm.showNoResults = false;
              vm.viewResultsTable = true; //this shows the filtered result set after everything's done
            }
          }, function(reason) {
            $log.error(reason);
          });

        } else {

          vm.showNoResults = false;
          vm.viewResultsTable = true; //this shows the default result set

        }
        //do stuff and then
        //TODO - this is where I need to determine if I need a new DataSvc request with params, before I show the results
        //show the results table only after fetching results
      } else {

        //do nothing
      }
    });

    //watch changes to the date dropdowns
    //this interacts with the DateSvc to have both dropdowns respond to the value of the other
    //too much logic for this in the client
    //TODO - this is duplicated in reports management controller. not ready to refactor out to the reports service right now, but should
    $scope.$watch(function() {
      return vm.date;
    }, function(newVal, oldVal) {
      $log.debug(oldVal.from);
      $log.debug(newVal.from);
      var newFromDate = newVal.from,
          oldFromDate = oldVal.from,
          newToDate = newVal.to,
          oldToDate = oldVal.to;
      if (!angular.equals(newFromDate, oldFromDate)) {
        DateSvc.setToMonthList(newFromDate).then(function(newToMonthList) {
          vm.dateRange.toDates = newToMonthList;
          $log.debug('HERE ARE vm.dateRange.toDates');
          $log.debug(vm.dateRange.toDates);
          if (vm.dateRange.toDates.indexOf(vm.date.to) === -1 && vm.dateRange.toDates.indexOf(DateSvc.stripLeadingZero(vm.date.to)) === -1) {
            var newToDatesLength = (vm.dateRange.toDates.length - 1);
            //$log.debug(vm.dateRange.toDates);
            //$log.debug(vm.dateRange.toDates.length);
            //$log.debug(vm.dateRange.toDates[newToDatesLength]);
            vm.date.to = vm.dateRange.toDates[newToDatesLength];
          }
        });
        //$log.debug(vm.dateRange.toDates);
        //$log.debug(vm.date.to);
      }
      if (!angular.equals(newToDate, oldToDate) || !angular.equals(newFromDate, oldFromDate)) {
        newDateSelected = true;
      } else {
        newDateSelected = false;
      }
    }, true); //add true as third argument to deep watch the vm.date object

    //Think this roundabout binding was unnecessary
    //
    // $scope.$watch(angular.bind(vm.pre, function() {
    //   if (typeof this === 'object') {
    //     var preObj = this;
    //     for (var preProp in preObj) {
    //       if (preProp === 'selected') {
    //         var selectedPreObj = preObj[preProp];
    //         return selectedPreObj; //bind to the pre object so we can handle changes in different properties within the callback
    //       }
    //     }
    //   }
    // }), function(newVal, oldVal) {

    //watch the pre object for its selected value
    //trigger the initial, unfiltered request for current reports based on the selected PRE
    $scope.$watch(function() {
      return vm.pre.selected;
    }, function(newVal, oldVal) {
      //$log.debug(oldVal);
      //$log.debug(newVal);
      if (!angular.equals(oldVal, newVal)) {
        newPreSelected = true;
        vm.preNotSelected = false;
        vm.viewResultsTable = false;
        vm.showNoResults = false;
      } else {
        newPreSelected = false;
      }
      var selectedPreObj = newVal,
        chosenPreAccess = 'FIN_UTIL'; //this is default, but will be reset directly afterward for correct value
      for (var selectedPreProp in selectedPreObj) {
        if (selectedPreProp === 'id') { //inspect the ID property of the selected PRE
          //$log.debug(selectedPreObj[selectedPreProp]);
          vm.chosenPreId = selectedPreObj[selectedPreProp];
        }
        if (selectedPreProp === 'access') { //inspect the access property of the selected PRE
          chosenPreAccess = selectedPreObj[selectedPreProp];
          switch (chosenPreAccess) { //set selectable reports to the full list, all clin, or all fin, depending on the user's access for that PRE
          //some of these settings (placholder) may be unnecessary, and the last one, outside of the switch/case, is important
            case 'FIN_UTIL':
              vm.selectableReports = vm.allSelectableReports;
              break;
            case 'UTIL':
              vm.selectableReports = vm.selectableUtilReports;
              setPlaceholder(vm.selectableReports);
              break;
            case 'FIN':
              vm.selectableReports = vm.selectableFinReports;
              setPlaceholder(vm.selectableReports);
              break;
            default:
              break;
          }
          vm.report.selected = vm.selectableReports[0]; //reset the report selector here
        }
      }
      //for use in the above switch/case
      function setPlaceholder(selectableReportsArray) {
        if (!angular.isUndefined(selectableReportsArray[0])) {
          if (!angular.isUndefined(selectableReportsArray[0].name) && !angular.isUndefined(selectableReportsArray[0].code)) {
            vm.reportsPlaceholder.name = selectableReportsArray[0].name;
            vm.reportsPlaceholder.code = selectableReportsArray[0].code;
          }
        }
      }

      //this is where we trigger fetching of current reports once a PRE is chosen
      if (vm.chosenPreId !== '') {
        DataSvc.reports.ByUserAndPre.get({ //this is a resource constructor, for working with the reports collection, payload can include indiv report ids and dateFrom/dateTo
          userId: vm.userId,
          preId: vm.chosenPreId
        }, function(reportsObj) {
          $log.debug(reportsObj);
          var lastReportDateArr = [];
          reportsObj.reports = angular.isArray(reportsObj.reports) ? reportsObj.reports : []; //just in case we didn't get an array, but we should (RSW-370)
          if(reportsObj.reports.length > 0){
            vm.showNoResults = false;
            vm.availableReports = reportsObj.reports;
            //var getReportsArray = [];
            $log.debug('vm.availableReports.length is 0: ');
            $log.debug(vm.availableReports.length === 0);
            $log.debug(vm.availableReports);
            //vm.preNotSelected = vm.availableReports.length === 0; //enable the report select if there are reports
            vm.preNotSelected = false; //we don't care if there are reports, because the user has to be able to change filters to see history
            vm.noAvailableReports = false;

            angular.forEach(reportsObj.reports, function(report, key) {

              $log.debug(report);

              var downloadUrl = API_URL + report.url,
                token = store.getItem(USER_STORE_PREFIX + 'auth-token'),
                year = report.date.slice(0, 4),
                month = report.date.slice(4);

              $log.debug('CHECKING WHAT REPORT DATE IS BEING FETCHED FOR SETTING CURRENT MONTH');
              $log.debug(report.date);
              lastReportDateArr.push(month);
              lastReportDateArr.push(year);
              $log.debug(lastReportDateArr);

              report.downloadUrl = downloadUrl + '/?token=' + token; //for downloading reports, we tack on the auth token as a query param

              //the stuff below probably can come out
              //this was a hacky way of setting old checkboxes/radiobuttons for report type
              //now we have a reports/types endpoint to get all the report types, and we filter above, upon watching the pre dropdown change value
              if (report.type === 'Clinical' && vm.reportType.hasType.clinical === false) {
                vm.reportType.hasType.clinical = true;
                vm.reportType.setType.clinical = true;
                vm.reportType.testRadioType = 'clinical';
              }
              if (report.type === 'Financial' && vm.reportType.hasType.financial === false) {
                vm.reportType.hasType.financial = true;
                vm.reportType.setType.financial = true;
              }
              //the stuff above can probably come out

              report.filteredDate = DateSvc.outputFriendlyYYYYMM(report.date); //before ending the loop, set the date to JS dateTime, for front-end filtering
              //TODO - these mappings aren't correct
              report.pdf = report.type === 'UTIL';
              report.xls = report.type === 'FIN';

              //TODO - see if the code block below needs to remain
              if (!$scope.$$phase) { //check to see that a digest isn't already running
                $scope.$apply(); //if it isn't, trigger using apply (hacky, but works)
              }
            });

            $log.debug('The lastReportDateArr:: ');
            $log.debug(lastReportDateArr);

            //This "should" work because we are being returned only the most recent reports, by default (the last month's available reports) - I'm just grabbing the first two values in what could be a large array
            var concatYearMonth = lastReportDateArr[0] + '/' + lastReportDateArr[1];

            setDates(concatYearMonth); //set dates based on available reports
          } else {
            //vm.showNoResults = true; //do this on submit
            setDates(); //reset dates
            vm.noAvailableReports = true; //TODO - add a value that is vm.noAvailableReports, or something like that - this is factually wrong
          }

          function setDates(dateToPass) {
            var dateArg = dateToPass ? dateToPass : '';
            DateSvc.setCurrentReportDate(dateArg).then(function(newVal) { //here we're setting the date selectors to reflect the range of available report history based on the month/year of the last available report (published)
              //vm.date.from = DateSvc.getCurrentReportDate();
              //vm.date.to = DateSvc.getCurrentReportDate();
              vm.dateRange.initialDate = vm.date.from = vm.date.to = DateSvc.getCurrentReportDate();
              vm.dateRange.fromDates = DateSvc.getFromMonthList();
              vm.dateRange.toDates = DateSvc.getToMonthList();
              $log.debug('vm.date.to: ' + vm.date.to);

              //$log.debug(DateSvc.getCurrentReportDate());
              //$log.debug(DateSvc.getFromMonthList());
            });
          }

        });
      }
    });
  }
}());
