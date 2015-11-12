/* jshint camelcase: false */
'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:ReportsAdminCtrl
 * @description
 * # Reports Management
 * Controller of the riskShareApp
 */

(function() {

  angular.module('riskShareAppReports').controller('ReportsAdminCtrl', ReportsAdminCtrl);

  ReportsAdminCtrl.$inject = ['DateSvc', 'DataSvc', 'ReportsSvc', 'MessagesSvc', 'API_URL', 'API_PATHS', 'USER_STORE_PREFIX', '$window', '$scope', '$log', 'usSpinnerService', 'ngDialog'];

  //controllerAs rptAdmin, from routes in reports.constants

  function ReportsAdminCtrl(DateSvc, DataSvc, ReportsSvc, MessagesSvc, API_URL, API_PATHS, USER_STORE_PREFIX, $window, $scope, $log, usSpinnerService, ngDialog) {
    var vm = this,
      newReportSelected = false,
      newDateSelected = false,
      store = $window.localStorage,
      reportResults = [],
      unbindSelectEachWatches,
      unbindTabSelectedWatch,
      lastSelectedTab = 0;

    //set up vm properties and methods  
    vm.report = {};
    vm.reportNotSelected = true;
    vm.dateRange = {
      fromDates: DateSvc.getFromMonthList(),
      toDates: [],
      initialDate: DateSvc.getCurrentReportDate()
    };
    vm.date = {
      from: DateSvc.getCurrentReportDate(),
      to: DateSvc.getCurrentReportDate()
    };
    vm.availableReports = [];
    vm.selectedReportCode = '';
    vm.showNoResults = false;
    vm.viewResultsTabs = false;
    vm.reportsPlaceholder = {
      name: '--Select--',
      code: '' //the logic here is that clinical is always first, and the name is just a placeholder - this will be reset depending on the PRE chosen
    };
    vm.reportTabs = []; //setup the container for all report info, which is an array of objects
    vm.searchBinding = false; //binding for the submit handler directive when doing a search
    vm.startSpin = function() {
      usSpinnerService.spin('spinner-1');
    };
    vm.stopSpin = function() {
      usSpinnerService.stop('spinner-1');
    };

    //set up the report status tabs using the endpoint for getting statuses and status codes
    DataSvc.reports.Codes.get(function(reportStatusObj) { //get the codes that now populate the reportTabs array with mostly dummy info in the objects.
      //more data has to come from the reports queries
      var reportStatusArr = reportStatusObj.statusCodes;

      function moveArrayItems(from, to) { //set up a convenience to move tabs around on setup
        /* jshint validthis: true */
        this.splice(to, 0, this.splice(from, 1)[0]);
      }

      //rearrange the report statuses for setting up the tabs
      moveArrayItems.call(reportStatusArr, 2, 0); //Move Generated to tab 1
      moveArrayItems.call(reportStatusArr, 3, 1); //Now move Published to tab 2
      //Retracted is now tab 3 and Rejected is tab 4

      $log.debug('reportStatusArr is:: ');
      $log.debug(reportStatusArr);
      angular.forEach(reportStatusArr, function(statusCodeObj, key) {
        //set up properties and methods for each tab object
        vm.reportTabs[key] = {
          index: key, //set an index property that maps to the array position of the tab
          status: {
            code: (function() {
              return statusCodeObj.code === 'P' ? 'C' : statusCodeObj.code; //replace 'P' with 'C'
            }()),
            name: (function() {
              return statusCodeObj.name.toLowerCase().indexOf('generated') > -1 ? 'Generated' : statusCodeObj.name;
            }())
          },
          content: statusCodeObj.name + ' tab here',
          reportType: 'Report type placeholder',
          reportName: 'Report name placeholder',
          selectAllReports: false,
          setSelectAllCheckbox: false,
          anyReportSelected: false,
          allReportsSelected: function() {
            var reportSelectedNum = 0,
                thisReportTab = vm.reportTabs[key];
            angular.forEach(thisReportTab.reports, function(report, key){
              if (report.reportSelected) {
                reportSelectedNum += 1;
              }
            });
            return reportSelectedNum === thisReportTab.reports.length;
          },
          allReportsClicked: function() {
            var thisReportTab = vm.reportTabs[key],
                newValue = !thisReportTab.allReportsSelected();
            angular.forEach(thisReportTab.reports, function(report, key){
              report.reportSelected = newValue;
            });
          },
          viewResultsTable: false,
          showNoResults: false,
          reports: [],
          manageBinding: false,
          showPublish: false,
          showRetract: false,
          showReject: false,
          tabSelected: false,
          publish: function() {},
          retract: function() {},
          reject: function() {}
        };
        switch (statusCodeObj.code) {
          case 'A': //retracted
            vm.reportTabs[key].showPublish = true;
            vm.reportTabs[key].showRetract = false;
            vm.reportTabs[key].showReject = true; //TODO - check whether this logic is correct
            break;
          case 'B': //rejected
            vm.reportTabs[key].showPublish = false;
            vm.reportTabs[key].showRetract = false;
            vm.reportTabs[key].showReject = false; //TODO - check to make sure this is correct
            break;
          case 'C': //generated
            vm.reportTabs[key].showPublish = true;
            vm.reportTabs[key].showRetract = false;
            vm.reportTabs[key].showReject = true; //TODO - check whether this logic is correct
            break;
          case 'D': //published
            vm.reportTabs[key].showPublish = false;
            vm.reportTabs[key].showRetract = true;
            vm.reportTabs[key].showReject = true; //TODO - check whether this logic is correct
            break;
          case 'P': //generated (original code)
            vm.reportTabs[key].showPublish = true;
            vm.reportTabs[key].showRetract = false;
            vm.reportTabs[key].showReject = true; //TODO - check whether this logic is correct
            break;
        }
      });
    });

    //get a list of available reports by type
    DataSvc.reports.Types.get(
      function(reportTypeObj) {
        $log.debug('reportTypeObj is:: ');
        $log.debug(reportTypeObj);
        var returnedReportObj = ReportsSvc.createReportsList(reportTypeObj);
        vm.availableReports = returnedReportObj.allIndivReports;
      }, function(reason) {
        $log.error('could not get report types/names because of: ');
        $log.error(reason);
      }
    );

    function reportSelectWatcher(tabReportObj) { //this function is always called with a specific tab object. it sets up watches in that tab and clears stuff out in hidden tabs
      //$log.debug('THIS IS THE TAB REPORT OBJECT');
      //$log.debug(tabReportObj.index);
      var selectedTabIndex = tabReportObj.index, //the index property of the currently selected tab
          reportSelectedNum = 0;

      if (angular.isFunction(unbindSelectEachWatches)) {
        unbindSelectEachWatches();
      } 

      tabReportObj.anyReportSelected = false;

      //clear everything in the currently hidden tabs
      angular.forEach(vm.reportTabs, function(tabReportObj, key) {
        if (key !== selectedTabIndex) { //this is any tab that isn't selected
          var oldReportsArray = tabReportObj.reports;
          if (oldReportsArray.length > 0) {
            // if (tabReportObj.selectAllReports) { //not being used now
            //   tabReportObj.selectAllReports = false; //clear the main checkbox, if it's checked
            // }
            angular.forEach(oldReportsArray, function(report, key) {
              report.reportSelected = false;
            });
          }
          tabReportObj.anyReportSelected = false;
        }
      });

      //$log.debug('tab was selected');
      $log.debug('This in the context of the reportSelectWatcher is:: ');
      $log.debug(tabReportObj);

      //watch for button state toggling
      //see if any reports are selected, and set vm value for buttons to be enabled
      unbindSelectEachWatches = $scope.$watchCollection(function() {
        var reportSelectedArray = [];
        angular.forEach(tabReportObj.reports, function(report, key) {
          reportSelectedArray.push(report.reportSelected);
        });
        return reportSelectedArray;
      }, function(newReportSelectedArray, oldReportSelectedArray, scope) {
        //$log.debug('WATCHCOLLECTION OF TABREPORTOBJ.REPORTS::::');
        //$log.debug(newReportSelectedArray);
        if (newReportSelectedArray !== oldReportSelectedArray) { //basically, this is just registering that I've clicked a checkbox again (it's a toggle)
          reportSelectedNum = 0;
          angular.forEach(newReportSelectedArray, function(thisReportSelected, key){
            if (thisReportSelected) {
              reportSelectedNum += 1; //add a selected report
            }
          });
        }
        if (reportSelectedNum > 0) { //check the iterator for whether any individual reports are selected
          tabReportObj.anyReportSelected = true;
        } else {
          tabReportObj.anyReportSelected = false;
        }
      });

    }

    //watch the value of the report dropdown for a selected report and change selected report code accordingly
    $scope.$watch(function() {
      return vm.report.selected;
    }, function(newVal, oldVal) {
      if (newVal && !angular.equals(oldVal, newVal)) {
        //resetResults();
        newReportSelected = true;
        $log.debug('New Report Selected: ');
        $log.debug(newVal);
        if (newVal.code) {
          vm.selectedReportCode = newVal.code;
          vm.reportsPlaceholder.code = newVal.code; //do this for the submit binding to have knowledge of changes to the reports dropdown, if it isn't still set to 'all available'
          vm.reportNotSelected = false;
          newReportSelected = true;
        }
      } else {
        newReportSelected = false;
      }
    });

    //watch changes to the date dropdowns
    //this interacts with the DateSvc to have both dropdowns respond to the value of the other
    //too much logic for this in the client
    //TODO - this is duplicated from reports view controller. not ready to refactor out to the reports service right now, but should
    $scope.$watch(function() {
      return vm.date;
    }, function(newVal, oldVal) {
      //$log.debug(oldVal.from);
      //$log.debug(newVal.from);
      var newFromDate = newVal.from,
        oldFromDate = oldVal.from,
        newToDate = newVal.to,
        oldToDate = oldVal.to;
      if (!angular.equals(newFromDate, oldFromDate)) {
        DateSvc.setToMonthList(newFromDate).then(function(newVal) {
          vm.dateRange.toDates = DateSvc.getToMonthList();
          $log.debug('HERE ARE vm.dateRange.toDates');
          $log.debug(vm.dateRange.toDates);
          if (vm.dateRange.toDates.indexOf(vm.date.to) === -1) {
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
        //resetResults();
        newDateSelected = true;
      } else {
        newDateSelected = false;
      }
    }, true); //add true as third argument to deep watch the vm.date object

    //watch the search button activity and then check modifiable values to create a new search
    $scope.$watch(function() {
      return vm.searchBinding;
    }, function(newVal, oldVal) {
      $log.debug('submit: ' + oldVal + ', ' + newVal);
      if (newVal !== oldVal) { //basically, this is just registering that I've clicked the button again (it's a toggle)
        if (newReportSelected || newDateSelected) { //TODO - this doesn't work - need another approach (doesn't keep new searches from running if you haven't changed date or report selections)
          vm.startSpin();
          var dateFromArr = vm.date.from.split('/'),
            dateToArr = vm.date.to.split('/'),
            fromDate = dateFromArr[1] + DateSvc.padMonth(dateFromArr[0], 2),
            toDate = dateToArr[1] + DateSvc.padMonth(dateToArr[0], 2);

          //define the payload for the reports GET request
          var dataObj = {
            date_from: fromDate,
            date_to: toDate
          };
          //add a selected report, if that filter is also being used
          if (!angular.isUndefined(vm.report.selected)) {
            dataObj.report_codes = vm.report.selected.code;
          }

          //Get the reports for the search with filters
          DataSvc.reports.Manage.get(dataObj, function(reportsObj) {
            reportsObj.reports = angular.isArray(reportsObj.reports) ? reportsObj.reports : []; //set the result to an array if it isn't already one
            setAndUpdateReportTabs(reportsObj.reports);
          }, function(reason) {
            $log.error(reason);
          });
        } else {
          vm.stopSpin();
          vm.showNoResults = false;
          vm.viewResultsTabs = true; //this shows the default result set
        }
      }
    });

    function setAndUpdateReportTabs(reports) { //reports always passed in as an array (empty or with results)
      //check whether there are no reports
      unbindWatches();
      if (reports.length === 0) { //if there are no reports using these search criteria
        angular.forEach(vm.reportTabs, function(tabReportObj, key) {
          //resets
          tabReportObj.reports = []; //clear out the reports arrays
        });
        vm.stopSpin();
        vm.showNoResults = true;
        vm.viewResultsTabs = false;
      } else { //if there are reports
        //things that need to be defined at the tab level (not the report level)
        angular.forEach(vm.reportTabs, function(tabReportObj, key) {
          //reset checkbox model in each tab
          tabReportObj.anyReportSelected = false;
          //tabReportObj.selectAllReports = false; //not being used now
          //other resets
          tabReportObj.reportName = vm.report.selected.name; //pull these from what's selected in the dropdown (to be displayed on the tables)
          tabReportObj.reportType = vm.report.selected.type.slice(0, -1); //trim plural
          tabReportObj.reports = []; //clear out the reports arrays
        });

        //stuff that needs to be defined for each report
        angular.forEach(reports, function(report, key) {
          $log.debug(report);
          //$log.debug(report);
          var downloadUrl = API_URL + report.url,
            downloadString = 'download/',
            reportStatusCode = report.releaseStatus.toLowerCase();

          //handle various issues with data coming back (or not, as the case may be)
          if (reportStatusCode === 'p') {
            reportStatusCode = 'c'; //right now we are getting back the unusable code 'p', which for our purposes is 'c' or generated
          }
          if (angular.isUndefined(report.preName) || report.preName === null || report.preName === '') {
            report.preName = 'N/A';
          }

          report.downloadUrl = downloadUrl + '/?token='; //for downloading reports, we tack on the auth token as a query param -- add the token from the vm value in the view

          report.parsedReportName = report.url.slice(report.url.indexOf(downloadString) + downloadString.length);
          $log.debug(report.parsedReportName);

          report.filteredDate = DateSvc.outputFriendlyYYYYMM(report.date); //before ending the loop, set the date to JS dateTime, for front-end filtering

          //push reports into correct tabs
          angular.forEach(vm.reportTabs, function(tabReportObj, key) {
            var statusCode = tabReportObj.status.code.toLowerCase();

            if (angular.equals(statusCode, reportStatusCode)) { //check the report status code against the code for the tab (by status)
              tabReportObj.reports.push(report); //add the report to that tab's table
            }
          });

        });

        //get the reports into their correct tabs, and now operate within tabs
        angular.forEach(vm.reportTabs, function(tabReportObj, key) {

          if (tabReportObj.reports.length > 0) { //there are reports for this tab
            tabReportObj.viewResultsTable = true;
            tabReportObj.showNoResults = false;

            //start off by setting all reports to not selected
            angular.forEach(tabReportObj.reports, function(report, key) {
              report.reportSelected = false;
            });

            tabReportObj.publish = function() {
              $log.debug('this is the publish event');
              $log.debug(this);
              updateReportsStatuses(this, 'D');
            };
            tabReportObj.reject = function() {
              $log.debug('this is the reject event');
              $log.debug(this);
              updateReportsStatuses(this, 'B');
            };
            tabReportObj.retract = function() {
              $log.debug('this is the retract event');
              $log.debug(this);
              updateReportsStatuses(this, 'A');
            };

          } else { //there are no reports for this tab
            tabReportObj.viewResultsTable = false;
            tabReportObj.showNoResults = true;
          }

          if (tabReportObj.tabSelected || tabReportObj.tabSelected === 'true') {
            lastSelectedTab = key;
            reportSelectWatcher(vm.reportTabs[lastSelectedTab]); //kick off the reportSelectWatcher when calling the instance, which is triggered by a search
          }

        });

        unbindTabSelectedWatch = $scope.$watchCollection(function() {
          var tabSelectedArray = [];
          angular.forEach(vm.reportTabs, function(tabReportObj, key) {
            tabSelectedArray.push(tabReportObj.tabSelected);
          });
          return tabSelectedArray; //watch tab selection
        }, function(newTabSelectedArray, oldTabSelectedArray, scope) {
          if(!angular.equals(newTabSelectedArray, oldTabSelectedArray)) {
            angular.forEach(newTabSelectedArray, function(thisTabSelectedVal, key) {
              if(thisTabSelectedVal || thisTabSelectedVal === 'true') {
                lastSelectedTab = key;
                reportSelectWatcher(vm.reportTabs[key]);
              }
            });
          }
        });

        vm.stopSpin();
        vm.showNoResults = false;
        vm.viewResultsTabs = true; //this shows the filtered result set after everything's done
      }
    }

    function updateReportsStatuses(reportsObj, method) {
      var reportsToSubmitArr = [],
        reportsArr = reportsObj.reports;
      angular.forEach(reportsArr, function(report, key) {
        var reportName = !angular.isUndefined(report.reportKeyName) ? report.reportKeyName : report.parsedReportName;
        if (report.reportSelected) {
          reportsToSubmitArr.push(reportName);
        }
      });

      var reportsToUpdate = reportsToSubmitArr.length,
        plural = reportsToUpdate > 1 ? 's' : '',
        pastTenseToBe = reportsToUpdate > 1 ? 'were' : 'was',
        friendlyAction = (function() {
          switch (method) {
            case 'D':
              return 'publish';
            case 'A':
              return 'retract';
            case 'B':
              return 'reject';
          }
        }()),
        pastTenseAction = 'ed',
        updateDataObj = {
          reportNames: reportsToSubmitArr,
          statusCode: method
        },
        dialogData = {
          heading: 'Are you sure?',
          text: '<p><strong>' + reportsToSubmitArr.length + '</strong> report' + plural + ' will be ' + friendlyAction + pastTenseAction + '.</p>',
          confirmButton: 'Yes, ' + friendlyAction,
          cancelButton: 'No, go back'
        };

      vm.confirmationDialog = ngDialog.openConfirm({
        template: 'core/directives/templates/confirm_dialog.html',
        data: dialogData
      }).then(function() {

        DataSvc.reports.SetStatus.update(updateDataObj, function(response) {
            $log.debug('updated reports:: ');
            //$log.debug(response.status);
            $log.debug(updateDataObj.reportNames); //this returns the object with a reportNames array and the status code used for update
            $log.debug(updateDataObj.statusCode);
            angular.forEach(reportResults, function(report, key) {
              $log.debug(report);
              if (updateDataObj.reportNames.indexOf(report.parsedReportName) > -1) { //change the status of updated reports in the initial reportResults array
                report.releaseStatus = updateDataObj.statusCode;
              }
            });
            setAndUpdateReportTabs(reportResults); //set up the tabs again with the updated reports list (with status updates)
            MessagesSvc.registerInfoMsg(reportsToSubmitArr.length + ' report' + plural + ' ' + pastTenseToBe + ' ' + friendlyAction + pastTenseAction + '!');
          },
          function(error) {
            $log.error(error);
          });

      });

    }

    //just a utility function to reset results on the search
    function resetResults() {
      vm.stopSpin();
      vm.showNoResults = false;
      vm.viewResultsTabs = false;
    }

    function unbindReportsWatch() {
      if (angular.isFunction(unbindSelectEachWatches)) {
        unbindSelectEachWatches();
        $log.debug('SCOPE WATCHES INSIDE UNBINDREPORTSWATCHES:: ');
        $log.debug($scope.$$watchers);
      }
    }

    function unbindWatches() {
      unbindReportsWatch();
      unbindTabWatch();
      $log.debug('SCOPE WATCHES INSIDE UNBINDWATCHES:: ');
      $log.debug($scope.$$watchers);
    }

    function unbindTabWatch() {
      if (angular.isFunction(unbindTabSelectedWatch)) {
        unbindTabSelectedWatch();
        $log.debug('SCOPE WATCHES INSIDE UNBINDTABWATCH:: ');
        $log.debug($scope.$$watchers);
      }
    }

  }
}());
