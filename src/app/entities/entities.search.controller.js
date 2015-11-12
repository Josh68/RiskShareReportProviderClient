'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:EntitiesSearch
 * @description
 * # EntitiesSearch
 * Controller of the riskShareApp
 */

(function() {

  angular
  	.module('riskShareAppEntities')
  	.controller('EntitiesSearchCtrl', EntitySearch);

  EntitySearch.$inject = ['$log', '$window', '$location', '$scope', '$filter', '$parse', 'DataSvc', 'UtilsSvc', 'usSpinnerService', 'USER_STORE_PREFIX', 'API_URL', 'paginationService'];

  function EntitySearch($log, $window, $location, $scope, $filter, $parse, DataSvc, UtilsSvc, usSpinnerService, USER_STORE_PREFIX, API_URL, paginationService) {
    var vm = this,
      store = $window.localStorage,
      searchDataObj = {}, //setup object for search requests outside of the submit, so this data can also be appended to links, allowing users to "return to search" from other views and reassemble the results
      submitCode = '',
      orderBy = $filter('orderBy');

    vm.startSpin = function() {
      usSpinnerService.spin('spinner-1');
    };
    vm.stopSpin = function() {
      usSpinnerService.stop('spinner-1');
    };

    vm.token = store.getItem(USER_STORE_PREFIX + 'auth-token');
    vm.downloadUrl = API_URL + '/entities/list/?token=' + vm.token; //for downloading, we tack on the auth token as a query param

    vm.formSubmitted = false;
    vm.formReverted = false;
    vm.formRequiredSet = false;
    vm.showNoResults = false;
    vm.viewResultsTable = false;

    vm.selectableEntityTypes = [ //populate the ui-select (dropdown). use codes in case names need to change
      {
        name: 'Health system name',
        code: 'hs'
      }, {
        name: 'PRE name',
        code: 'pres'
      }, {
        name: 'TIN',
        code: 'tins'
      }, {
        name: 'Group name',
        code: 'names'
      }
    ];

    vm.selectableEntityCodes = [ //populate the ui-select (dropdown). use codes in case names need to change
      'hs', 'pres', 'tins', 'names'
    ];

    vm.onEntityTypeSelect = function($item, $model) {
      if (angular.isUndefined(vm.searchFormData.entityType.selected)) {
        vm.formRequiredSet = false; //disable the submit if nothing's selected
      } else {
        vm.formRequiredSet = true; //if there's a selected type, enable the submit
        //check if PRE is chosen, and if so, set the statusFilter to null so that none of the radio buttons are selected
        vm.searchFormData.associatedFilter = 'true';
        if (vm.searchFormData.entityType.selected.code === 'pres') {
          vm.searchFormData.statusFilter = null;
        } else {
          vm.searchFormData.statusFilter = 'true';
        }
      }
    };

    vm.searchFormData = {
      searchTerm: '',
      entityType: {},
      associatedFilter: 'true',
      statusFilter: 'true'
    };

    vm.originalSearchFormData = angular.copy(vm.searchFormData);

    vm.resultsTable = {
      recordsFound: '0',
      columns: [],
      items: [],
      isHs: false
    };

    vm.submit = function() {
      var selectedEntityType = '', //initialize this variable to an empty string
        searchTerm = vm.searchFormData.searchTerm,
        searchTermPresent = searchTerm.length === 0 ? false : true;

      if (vm.searchFormData.entityType.selected) {
        submitCode = vm.searchFormData.entityType.selected.code; //set this top-level variable to the selected entity type code if something is already selected
        selectedEntityType = submitCode === 'names' ? 'tins' : submitCode; //now re-set the empty string variable, used in the switch-case, below
      }

      if (selectedEntityType !== '') { //Only proceed if selectedEntityType was set with a value

        searchDataObj = {}; //reset the searchDataObj before repopulating  

        vm.formSubmitted = true;

        vm.startSpin();

        if (vm.searchFormData.associatedFilter !== '') {
          searchDataObj.associated = vm.searchFormData.associatedFilter;
        }
        if (vm.searchFormData.statusFilter !== '' && selectedEntityType !== 'pres') {
          searchDataObj.active = vm.searchFormData.statusFilter;
        }

        switch (selectedEntityType) {
          case 'pres':
            if (searchTermPresent) {
              searchDataObj.name = searchTerm;
            }
            DataSvc.pres.FilteredAll.get(searchDataObj, function(response) {
              $log.debug(response);
              searchHandler(response.pres, 'pres');
            });
            break;
          case 'tins':
            if (searchTermPresent) {
              searchDataObj.tin = searchTerm;
            }
            DataSvc.tins.FilteredAll.get(searchDataObj, function(response) {
              searchHandler(response.tins, 'tins');
            });
            break;
          case 'hs':
            if (searchTermPresent) {
              searchDataObj.name = searchTerm;
            }
            DataSvc.hs.FilteredAll.get(searchDataObj, function(response) {
              searchHandler(response.hs, 'hs');
            });
            break;
          default: //should be unnecessary, but kept in here as a safety - if there is no selected entity type, just stop the spinner, if one started for some reason
            vm.stopSpin();
            vm.formSubmitted = false; //set this value back to false if no submission is actually going to take place
        }
      }
    };

    vm.editResult = function(url) {
      var editHs = url.indexOf('/entities/hs') > -1,
        editPre = url.indexOf('/entities/pres') > -1,
        editTin = url.indexOf('/entities/tins') > -1;
      if (editHs) {
        editResultHandler('hs', url);
      }
      if (editTin) {
        editResultHandler('tins', url);
      }
      if (editPre) {
        editResultHandler('pres', url);
      }
    };

    vm.init = function() {
      var searchQuery = $location.search(),
        emptySearch = UtilsSvc.isEmpty(searchQuery); //check to see whether there are any query params
      $log.debug('Init function called');
      $log.debug(searchQuery);
      if (!emptySearch) {
        angular.forEach(vm.selectableEntityTypes, function(obj, key) {
          if (obj.code === searchQuery.entity) {
            vm.searchFormData.entityType.selected = obj;
          }
        });
        vm.searchFormData.searchTerm = searchQuery.name ? searchQuery.name : searchQuery.tin ? searchQuery.tin : '';
        if (searchQuery.active) {
          vm.searchFormData.statusFilter = searchQuery.active;
        } else {
          vm.searchFormData.statusFilter = ''; //if there are query params but active isn't one of them, this is the value for "all"
        }
        if (searchQuery.associated) {
          vm.searchFormData.associatedFilter = searchQuery.associated;
        } else {
          vm.searchFormData.associatedFilter = ''; //if there are query params but associated isn't one of them, this is the value for "both"
        }
        vm.originalSearchFormData = angular.copy(vm.searchFormData);
        vm.submit();
      }
    };

    vm.checkState = function() { //triggered on keyup and mouseup on the form, check the state of the form
      vm.formReverted = angular.equals(vm.searchFormData, vm.originalSearchFormData);
    };

    //helper functions

    function editResultHandler(entityType, passedInUrl) {
      var regexPattern = /\/id\/\d+/,
        idToEdit = passedInUrl.match(regexPattern)[0].slice(4), //remove the portion of the id pattern that is '/id/'
        newUrl = '/entities/' + entityType + '/edit/?id=' + idToEdit + '&search_entity=' + submitCode;

      angular.forEach(searchDataObj, function(value, prop) {
        var addPropQueryString = '&search_' + prop + '=' + value;
        newUrl += addPropQueryString;
      });
      $log.debug('edit ' + entityType + ' at this url: ' + passedInUrl);
      $log.debug('the new url is: ' + newUrl);
      $location.url(newUrl);
    }

    function searchHandler(response, searchType) { //response should be an array (RSW-370)
      var resultsArr = []; //set an empty array
      $log.debug(response);
      vm.stopSpin();
      if (angular.isArray(response)) {
        resultsArr = response; //set the local array to the response (empty or with results)
      }
      vm.resultsTable.recordsFound = resultsArr.length;
      if (resultsArr.length === 0) {
        $log.debug('no results');
        // Reset the resultTable Items to 0. Makes sure the previous results dissapear.
        vm.resultsTable.items = [];
        showNoResults();
      } else {
          $scope.pageSize = 100;
          paginationService.setCurrentPage('entitiesPagination', 1);
    	  populateResultsTable(resultsArr, searchType);
      }
      vm.formSubmitted = false;
      vm.formRequiredSet = true;
    }

    function populateResultsTable(results, searchType) {
      var selectedEntityCode = vm.searchFormData.entityType.selected.code,
        tinsSelected = selectedEntityCode === 'tins';
      switch (searchType) {
        case 'pres':
          angular.forEach(results, function(item, key) {
            item.hsName = !item.hs ? '' : item.hs.name;
            item.hsUrl = !item.hs ? '' : item.hs.url;
            item.active = true; //there is no such thing as a deactivated pre, so put this here to help the view
          });
          vm.resultsTable.isHs = false;
          vm.resultsTable.columns = [{
            header: 'Provider entity',
            details: [{
              url: 'url',
              name: 'name'
            }]
          }, {
            header: 'Health system',
            details: [{
              url: 'hsUrl',
              name: 'hsName'
            }]
          }];
          vm.resultsTable.items = orderBy(results, 'name');
          break;
        case 'tins':
          var localResultsArr = [];
          angular.forEach(results, function(item, key) { //Set a new value on the results items that combines the tin and name. Create a computed depending on whether this is a TIN search or group name search, and whether there's a name (there's always a TIN, and really, always should be a name (which may actually be a dupe of the TIN)). For either, the computed is only the TIN if there's no name. For TIN search, the full computed is TIN - Name. For Group name search, the full computed is Group name - TIN.
            item.computedName = !item.name ? item.tin : tinsSelected ? item.tin + ' - ' + item.name : item.name + ' - ' + item.tin;
          });
          vm.resultsTable.isHs = false;

          vm.resultsTable.columns = [{
            header: 'TIN-Group',
            details: [{
              url: 'url',
              name: 'computedName',
              active: 'active'
            }]
          }];
          localResultsArr = orderBy(results, 'computedName'); //store the sorted results before doing the following re-order for Group name searches
          if (!tinsSelected) { //if we're searching by group name, split up the results and put the named items first
            var tempNameArr = [],
                tempTinArr = [];
            angular.forEach(localResultsArr, function(value, key) {
              if (value.name && value.name !== '') {
                tempNameArr.push(value);
              } else {
                tempTinArr.push(value);
              }
            });
            localResultsArr = tempNameArr.concat(tempTinArr);
          }
          vm.resultsTable.items = localResultsArr; //set the VM value to the local array
          break;
        case 'hs':
          var presArray = [];
          vm.resultsTable.isHs = true;
          vm.resultsTable.columns = [{
            header: 'Health system',
            details: [{
              url: 'url',
              name: 'name',
              active: 'active'
            }]
          }, {
            header: 'Provider entity',
            details: []
          }];

          (function populateDetails() {
            angular.forEach(results, function(result, resultsKey) {
              presArray[resultsKey] = [];
              angular.forEach(result, function(propVal, resultKey) {
                if (resultKey === 'pres') {
                  //presArray[resultsKey].preArray = [];
                  angular.forEach(propVal, function(preValue, preKey) {
                    //presArray[resultsKey].preArray[preKey] = {};
                    //presArray[resultsKey].preArray[preKey].name = preValue.name;
                    //presArray[resultsKey].preArray[preKey].url = preValue.url;
                    presArray[resultsKey].push({
                      name: preValue.name,
                      url: preValue.url,
                      active: true //there is no such thing as a deactivated pre, so put this here to help the view
                    });
                  });
                }
              });
            });
          }());
          vm.resultsTable.columns[1].details = presArray;
          vm.resultsTable.items = orderBy(results, 'name');
          break;
      }
      //now show the results
      showResults();
    }

    function showResults() {
      vm.showNoResults = false;
      vm.viewResultsTable = true;
    }

    function showNoResults() {
      vm.showNoResults = true;
      vm.viewResultsTable = false;
    }

    vm.init();

    $scope.inputName = 'entityTypeSelect'; //hack to work with modified directive for ui-select
  }

}());
