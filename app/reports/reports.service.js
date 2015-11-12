'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:Reports
 * @description
 * # Reports
 * Service of the riskShareApp
 */

(function(){

  angular
    .module('services.Reports', [])
    .factory('ReportsSvc', ReportsSvc);

  ReportsSvc.$inject = ['$log', '$q', 'CONTENT'];

  function ReportsSvc ($log, $q, CONTENT) {

    var service = {
      createReportsList: createReportsList
    };

    return service;

    function createReportsList (reportTypeObj) { //this is way too much business logic in the client, but oh well
    //setup a return object that includes separate reports lists and a list to be concatenated from the 2
      var returnObj = {
            selectableUtilReports: [],
            selectableFinReports: [],
            allSelectableReports: []
          },
          //two objects to be added to each list which proxy for all the reports in each category, and show in the dropdown
          finObjZero = CONTENT.reports.view.reportsHeaders.financial,
          utilObjZero = CONTENT.reports.view.reportsHeaders.clinical;

      //alphabetize the separate arrays
      reportTypeObj.fin = alphaReportsArray(reportTypeObj.fin);
      reportTypeObj.util = alphaReportsArray(reportTypeObj.util);

      //for reports management, add a type to each returned report name
      angular.forEach(reportTypeObj.fin, function(value, key) {
        var reportObj = value;
        reportObj.type = 'Financial reports';
      });

      angular.forEach(reportTypeObj.util, function(value, key) {
        var reportObj = value;
        reportObj.type = 'Clinical reports';
      });

      //add modified, passed-in objects to the return objects
      returnObj.indivUtilReports = reportTypeObj.util;
      returnObj.indivFinReports = reportTypeObj.fin;
      returnObj.allIndivReports = reportTypeObj.util.concat(reportTypeObj.fin);

      //for report viewing, add the "all" selections to the dropdown, but only if there are reports of that type, otherwise leave the array empty
      if (reportTypeObj.fin.length > 0) {
        reportTypeObj.fin.unshift(finObjZero);
      }
      if (reportTypeObj.util.length > 0) {
        reportTypeObj.util.unshift(utilObjZero);
      }

      //again, add modified, passed-in objects to a separate set of return objects that have the ALL options appended
      returnObj.selectableUtilReports = reportTypeObj.util;
      returnObj.selectableFinReports = reportTypeObj.fin;
      returnObj.allSelectableReports = reportTypeObj.util.concat(reportTypeObj.fin);

      //$log.debug('REPORT TYPE OBJECT UTILOBJ IS: ');
      //$log.debug(reportTypeObj.util);
      //$log.debug('REPORT TYPE OBJECT FINOBJ IS: ');
      //$log.debug(reportTypeObj.fin);
      //$log.debug('REPORT TYPE OBJECT IS: ');
      //$log.debug(returnObj.allSelectableReports);

      return returnObj;
    }

    function alphaReportsArray(array) {
      return array.sort(function(reportTypeA, reportTypeB) {
        if (reportTypeA.name > reportTypeB.name) {
          return 1;
        }
        if (reportTypeB.name > reportTypeA.name) {
          return -1;
        }
        //if they are equal
        return 0;
      });
    }

  }

}());
