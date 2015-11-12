'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:TinManage
 * @description
 * # TinManage
 * Controller of the riskShareApp
 */

//TODO - One issue with this controller (among many, I'm sure) is that checkState, used to evaluate the state of the form in relation to its initial state, is triggered in many places in different ways. Really, it should be delegated from the form-level on various events (keyup, mouseup, ?), without watches. In other controllers, this is handled with the watch-form directive. No time to change the way it's handled here right now, but maybe in a future refactor.

(function() {

  angular.module('riskShareAppEntities').controller('TinManageCtrl', TinManage);

  //ctrlOptions is an options object passed from the route resolve, to condition stuff for edit and create
  TinManage.$inject = ['DataSvc', 'MessagesSvc', '$log', '$q', '$scope', '$location', '$timeout', '$filter', '$routeParams', 'ctrlOptions', 'CONTENT', 'UtilsSvc', 'EntitiesSvc', '$window', 'debounce'];

  function TinManage(DataSvc, MessagesSvc, $log, $q, $scope, $location, $timeout, $filter, $routeParams, ctrlOptions, CONTENT, UtilsSvc, EntitiesSvc, $window, debounce) {
    var vm = this,
      queryParams = $location.search(),
      moment = $window.moment,
      validTinPattern = /^\d{9}$/,
      isValidTinPattern = false,
      isDuplicateTin = false,
      isInvalidTin = false,
      isDuplicateGroupName = false,
      tinHasEmptyModel = false,
      tinIsDirtyInput = false,
      nameHasEmptyModel = false,
      nameIsDirtyInput = false,
      showInvalidTin = false,
      showRequiredTin = false,
      showInvalidName = false,
      showRequiredName = false,
      emptyTinsObject = {
        list: [], //start with an empty array, to be populated on vm init
        tinAndNameList: [], //empty array to hold just the strings with "TIN - Group Name",
        tinList: [],
        groupNameList: [],
        // list: [ //sample of what the list will look like
        //   {
        //     tin: '123456789'
        //     name: 'TIN 1',
        //     id: '000001',
        //     url: '/path/to/tin'
        //   }],
        selected: {
          tin: '', // This will hold the selected item
          name: '',
          output: '', //an empty placeholder used by selectable typeaheads - in this case, just a TIN number (not a concatenated string with the TIN and a group name)
          active: true,
          deactivate: false
        }
      },
      originalTinsObject = angular.copy(emptyTinsObject),
      originalTinSelectedObject = angular.copy(emptyTinsObject.selected),
      originalTinPopulatedObject; //will be filled in when coming to edit

    vm.modaDateFormat = CONTENT.modaDateFormat;
    vm.originalDateFormat = CONTENT.originalDateFormat;
    vm.deactivatePartial = 'entities/tins/deactivate.html';

    vm.formSubmitted = false;

    //the tins object for the controller
    vm.tins = {};
    angular.copy(emptyTinsObject, vm.tins);

    //ham-handed way of controlling what shows up in which view, both of which are backed by the same controller
    vm.showCreate = ctrlOptions.isTinCreate;
    vm.showEdit = !ctrlOptions.isTinCreate;

    //an object to help with validations
    vm.manageTinFormData = {
      tin: {
        showRequired: false,
        showInvalid: false,
        checkValidity: function() {
          checkTinInvalidState();
          vm.manageTinFormData.tin.showInvalid = showInvalidTin;
          vm.manageTinFormData.tin.showRequired = showRequiredTin;
        },
        checkHideErrors: function() {
          debounce(100, checkTinInvalidState());
          if (tinIsDirtyInput) {
            if (!tinHasEmptyModel && !isValidTinPattern) {
              return false;
            }
            if (tinHasEmptyModel) {
              vm.manageTinFormData.tin.showInvalid = showInvalidTin;
              vm.manageTinFormData.tin.showRequired = showRequiredTin;
            }
            if (isValidTinPattern && !isDuplicateTin) {
              vm.manageTinFormData.tin.showInvalid = showInvalidTin;
              vm.manageTinFormData.tin.showRequired = showRequiredTin;
              return true;
            }
            return false;
          }
          return true;
        },
        minLength: 3
      },
      groupName: {
        showRequired: false,
        showInvalid: false,
        checkValidity: function() {
          checkNameInvalidState();
          vm.manageTinFormData.groupName.showRequired = showRequiredName;
          vm.manageTinFormData.groupName.showInvalid = showInvalidName;
        },
        checkHideErrors: function() {
          checkNameInvalidState();
          if (showRequiredName && !showInvalidName || showInvalidName) {
            vm.manageTinFormData.groupName.showRequired = showRequiredName;
            vm.manageTinFormData.groupName.showInvalid = showInvalidName;
          }
          return !showRequiredName && !showInvalidName;
        },
        minLength: 3
      },
      tinPreDateRange: {
        showInvalid: false,
        checkIsValid: function(preForm) { //bind to keyup (either declaratively or on ng-class, etc)
          var effDateCopy = restoreFormattedDate(angular.copy(preForm.tinPreEffDate.$modelValue)),
              endDateCopy = restoreFormattedDate(angular.copy(preForm.tinPreEndDate.$modelValue)),
              invalidDateRange = moment(endDateCopy).isBefore(effDateCopy);
          //$log.debug('effDateCopy:: ' + effDateCopy);
          //$log.debug('endDateCopy:: ' + endDateCopy);

          if (invalidDateRange || effDateCopy.length !== 10) {
            preForm.tinPreEffDate.$setValidity('effDate', false);
            //vm.manageTinFormData.tinPreDateRange.showInvalid = true; //these need to be bound to a blur event
          }
          if (invalidDateRange || endDateCopy.length !== 10) {
            preForm.tinPreEndDate.$setValidity('endDate', false);
            //vm.manageTinFormData.tinPreDateRange.showInvalid = true;
          }
          if (!invalidDateRange && effDateCopy.length === 10 && endDateCopy.length === 10) {
            preForm.tinPreEffDate.$setValidity('effDate', true);
            preForm.tinPreEndDate.$setValidity('endDate', true);
            //vm.manageTinFormData.tinPreDateRange.showInvalid = false;
          }
        }
      },
      formReverted: false
    };

    vm.onTinTypeAhead = function() { //linked to the TIN typeahead directive, handle validations within the callback from the typeahead event
      var deferred = $q.defer(),
          tinTinArray = [], //create an array that contains just TINs from the list
          tinTin = '';
      if (!angular.isUndefined(vm.manageTinForm.tinInput)) {
        var tinModelVal = vm.manageTinForm.tinInput.$modelValue;
        if (angular.isString(tinModelVal)) {
          getFilteredTins(tinModelVal).then(function(tinList){
            isDuplicateTin = false; //reset this value when checking a new valid TIN
            if (validTinPattern.test(tinModelVal)) { //if this is a full, valid tin, check to see if it's a duplicate of something in the list
              angular.forEach(tinList, function(tin, key) {
                if (tin.tin === tinModelVal) {
                  isDuplicateTin = true;
                }
              });
            }
            deferred.resolve(tinList); //returns the results list to the type-ahead directive, to display the results
          });
        }
      }

      return deferred.promise;
    };

    vm.onGroupNameTypeAhead = function(event) {
      var deferred = $q.defer();
      if (angular.isString(vm.tins.selected.name)) {
        var lcSelectedName = vm.tins.selected.name.toLowerCase();
        vm.checkState(event);
        getFilteredTins(vm.tins.selected.name).then(function(tinList) {
          isDuplicateGroupName = false; //reset this value when checking a new name
          angular.forEach(tinList, function(tin, key) {
            if (angular.isString(tin.name)) {
              var lcTinName = tin.name.toLowerCase();
              if (lcTinName === lcSelectedName) {
                isDuplicateGroupName = true;
              }
            }
          });
          deferred.resolve(tinList);
        });
      }
      return deferred.promise;
    };

    vm.onGroupNameSelect = function() {
      vm.checkState();
    };

    vm.editPre = function(id) {
      $location.url('/entities/pres/edit/?id=' + id);
    };

    vm.create = function() {
      vm.formSubmitted = true; //prevent double submit
      $log.debug(vm.manageTinForm);
      var dataObj = {
        tin: vm.tins.selected.tin,
        name: vm.tins.selected.name
      };
      DataSvc.tins.Create.save(dataObj, function(response) {
        tinCreated(response);
        angular.copy(emptyTinsObject, vm.tins);
        // vm.tins.selected = {
        //   name: '',
        //   tin: '',
        //   output: '',
        //   active: true,
        //   deactivate: false
        // };
        vm.manageTinForm.$setPristine();
        vm.formSubmitted = false; //allow submit again
      }, function(reason){
        $log.error('Could not create TIN because:: ');
        $log.error(reason);
        vm.formSubmitted = false; //allow submit again
      });
    };

    vm.update = function() {
      vm.formSubmitted = true; //prevent double submit
      var dataObj = {};

      dataObj.pres = angular.copy(vm.tins.selected.pres);
      dataObj.name = vm.tins.selected.name;
      dataObj.active = vm.tins.selected.active;

      //remove extranous properties and methods
      delete dataObj.id;
      delete dataObj.output;
      delete dataObj.deactivate;
      delete dataObj.setActiveState;

      //remove extraneous properties from each pre
      angular.forEach(dataObj.pres, function(pre, key) {
        delete pre.id; //remove extraneous properties
        delete pre.url;
        delete pre.name;
        delete pre.showInvalid;
        //fix for mask's removal of date dashes on the model (ISO-8601)
        pre.effDate = restoreFormattedDate(pre.effDate);
        pre.endDate = restoreFormattedDate(pre.endDate);
        //var stringifiedPre = UtilsSvc.stringifyObjData(pre);
        //dataObj.pres[key] = stringifiedPre; //stringify number and boolean values
      });

      //dataObj = UtilsSvc.stringifyObjData(dataObj); //stringify number and boolean values

      $log.debug('here\'s the data object for update');
      $log.debug(dataObj);

      DataSvc.tins.Save.update({
        id: $routeParams.id
      }, dataObj, function(response) {
        vm.formSubmitted = false; //allow submit again
        if (!angular.isUndefined(response.errorMsg)) {
          // handle
          angular.noop();
        } else {
          tinUpdated(response.updateTin);
        }
        // }
      }, function(reason) {
        $log.error('Could not update TIN because:: ');
        $log.error(reason);
        vm.formSubmitted = false; //allow submit again
      });
    };

    //this is all for the purpose of setting showInvalid on a containing element. setValidity (for angular validations) needs to be set in a directive. the directive watches showInvalid states from the controller.
    //this is crappy, at best, but angular 1.2 is a PITA for iterated validations, particularly custom ones like this. it would have been much better to build an advanced directive for date ranges and get lots of this out of the controller
    vm.checkState = function(event) { //tied to the watch-input directive (a combined keyup and blur handler), passes the event back to the controller
      var effDateArr = [],
          endDateArr = [],
          dateRangeArr = [],
          clonedTinsSelected = angular.copy(vm.tins.selected),
          tabOrBlur = !event ? false : event.keycode === 9 || event.type === 'blur',
          formIsValid,
          formRevertedVar = false,
          originalTinPopulatedObjectCopy,
          clonedTinsSelectedCopy;

      if (!angular.isUndefined(vm.manageTinForm)) {
        formIsValid = vm.manageTinForm.$valid;
      }

      $log.debug(event);

      if (tabOrBlur) {
        MessagesSvc.clearErrors();
        MessagesSvc.clearInfoMsgs();
      }

      vm.manageTinFormData.tinPreDateRange.showInvalid = false; //reset this value to false. this is controlling the class on the parent element of the date range fields

      angular.forEach(clonedTinsSelected.pres, function(pre, key) { //get dates back into ISO-8601 format (mangled by ui-mask directive) and populate date-range arrays for comparisions

        pre.effDate = clonedTinsSelected.pres[key].effDate = restoreFormattedDate(pre.effDate);
        pre.endDate = clonedTinsSelected.pres[key].endDate = restoreFormattedDate(pre.endDate);

        //$log.debug(clonedTinsSelected.pres[key].effDate);
        //$log.debug(clonedTinsSelected.pres[key].endDate);

        // $log.debug('after reformatting');
        // $log.debug(pre.effDate);
        // $log.debug(pre.endDate);

        //populate two parallel arrays of effDate and endDate
        effDateArr.push(pre.effDate);
        endDateArr.push(pre.endDate);
        dateRangeArr.push({
          effDate: pre.effDate,
          endDate: pre.endDate
        });
      });

      //remove updated "showInvalid" properties from pres to setup for formReverted comparison
      originalTinPopulatedObjectCopy = angular.copy(originalTinPopulatedObject);
      clonedTinsSelectedCopy = angular.copy(clonedTinsSelected);

      if (angular.isObject(originalTinPopulatedObjectCopy)) {
        delete originalTinPopulatedObjectCopy.active; //delete this property that is set in the watch on the deactivate property
        angular.forEach(originalTinPopulatedObjectCopy, function(value, key){
          // $log.debug(key + ': ' + value);
          // angular.forEach(presObj, function(value, key){
          //   $log.debug(key + ': ' + value);
          // });
          if (key === 'pres') {
            angular.forEach(value, function(pre, key){
              delete pre.showInvalid;
            });
          }
        });
      }

      if (angular.isObject(clonedTinsSelectedCopy)) {
        delete clonedTinsSelectedCopy.active; //same thing - these will throw off the formReverted comparison
        angular.forEach(clonedTinsSelectedCopy, function(value, key){
          //$log.debug(key + ': ' + value);
          if (key === 'pres') {
            angular.forEach(value, function(pre, key){
              delete pre.showInvalid;
            });
            //$log.debug(value);
          }
        });
      }

      //do formReverted comparison
      formRevertedVar = angular.equals(originalTinPopulatedObjectCopy, clonedTinsSelectedCopy);
      vm.manageTinFormData.formReverted = formRevertedVar;
      $log.debug('vm.manageTinFormData.formReverted: ' + vm.manageTinFormData.formReverted);

      var dateRangeArrLength = dateRangeArr.length;

      //these are the actual date-range validations (within ranges and against each other)
      angular.forEach(dateRangeArr, function(range, thisRangeKey){
        var thisRange = moment().range(range.effDate, range.endDate),
            i;

        vm.tins.selected.pres[thisRangeKey].showInvalid = false;

        for (i = 0; i < dateRangeArrLength; i++) { //iterate within iterator

          var invalidRange = moment(dateRangeArr[i].endDate).isBefore(dateRangeArr[i].effDate),
              invalidEffDate = dateRangeArr[i].effDate.length < 10 || !moment(dateRangeArr[i].effDate).isValid(),
              invalidEndDate = dateRangeArr[i].effDate.length < 10 || !moment(dateRangeArr[i].effDate).isValid();

          //check that the endDate doesn't precede the effDate for each range
          if (tabOrBlur && (invalidRange || invalidEffDate || invalidEndDate)) {
            vm.tins.selected.pres[i].showInvalid = true; //add invalid property if true
            vm.manageTinFormData.tinPreDateRange.showInvalid = true;  //only set this to true here, after the reset
            if (invalidRange) {
              MessagesSvc.registerErrors('A date range is invalid.');
            }
            if (invalidEffDate || invalidEndDate) {
              MessagesSvc.registerErrors('A date is invalid.');
            }
          }
          // else {
          //   vm.tins.selected.pres[i].showInvalid = false;
          // }

          //check for range overlap
          if (i !== thisRangeKey) { //skip comparison of a range against itself
            var compareRange = moment().range(moment(dateRangeArr[i].effDate).subtract(1, 'days'), moment(dateRangeArr[i].endDate).add(1, 'days')); //add and subtract 1 (effDate/endDate) to prevent the same day from being considered as NOT overlapping (ie, the same day is an overlap in our rules)
            if (thisRange.overlaps(compareRange)) { //uses moment.js and moment-range to check for ovelap or intersection (presuming that we want to avoid both)
              vm.tins.selected.pres[thisRangeKey].showInvalid = true;
              vm.manageTinFormData.tinPreDateRange.showInvalid = true; //only set this to true here, after the reset
              MessagesSvc.registerErrors('Date ranges cannot overlap.');
            }
            // else { //should not need to do this after setting false before the checks
            //   vm.tins.selected.pres[thisRangeKey].showInvalid = false;
            // }
          }

        }
      });

      function delayedRegisterErrors(error) {
        $timeout(function(){
          MessagesSvc.registerErrors(error);
        }, 0);
      }
    };

    vm.returnToSearch = function() {
      EntitiesSvc.returnToSearch();
    };

    //Watches

    $scope.$watch(function(){
      return vm.tins.selected.deactivate;
    }, function(newVal, oldVal){
      $log.debug('Deactivate this TIN?:: ' + vm.tins.selected.deactivate);
      vm.tins.selected.active = vm.tins.selected.deactivate ? false : true;
      vm.checkState();
    });

    //Functions

    function tinCreated(response) {
      $log.debug(response);
      resetManageTinForm();
      if (!angular.isUndefined(response.createTin.infoMsg)) {
        MessagesSvc.registerInfoMsg(response.createTin.infoMsg);
      }
      //getTins();
    }

    function tinUpdated(response) {
      resetManageTinForm(); //this is to reset the tins object before repopulating
      if (!angular.isUndefined(response.infoMsg)) {
        MessagesSvc.registerInfoMsg(response.infoMsg);
        delete response.infoMsg;
      }
      if (!angular.isUndefined(response.errors)) {
        delete response.errors;
      }
      populateTinToEdit(response); //populate the form
    }

    function resetManageTinForm() {
      vm.tins = originalTinsObject; //reset before repopulating
      if (!angular.isUndefined(vm.manageTinForm)) {
        vm.manageTinForm.$setPristine();
      }
    }

    if (queryParams.id && typeof queryParams.id === 'string') { //if there's a query string with an ID and it has a value, this is coming from search and passing an ID to edit, so call for the TIN's details
      getTinToEdit(queryParams.id);
    }

    function getTins() {
      DataSvc.tins.FilteredAll.get(function(response) {
        createTinList(response);
      });
    }

    function getFilteredTins(tinString) {
      var dataObj = {
        tin: tinString
      },
      deferred = $q.defer();
      DataSvc.tins.FilteredAll.get(dataObj, function(response){
        deferred.resolve(response.tins);
      });
      return deferred.promise;
    }


    //make a call to get the list of all tins for the typeahead
    //being replaced for now by an ajaxified typeahead (see get FilteredTins and vm.onTinTypeAhead, used in the typeahead directive)
    //getTins();

    //set the tins list on the controller
    function createTinList(tinList) {
      vm.tins.list = tinList.tins;

      // vm.tins.list = [{
      //   tin: '123456789',
      //   name: 'A Group',
      //   url: '/entities/tins/id/000001',
      //   active: 'true',
      //   id: '000001',
      //   available: 'true'
      // }];

      var tinTin = '',
        tinName = '';
      angular.forEach(vm.tins.list, function(tin, key) {
        angular.forEach(tin, function(value, key) {
          if (key === 'tin') {
            tinTin = value;
          }
          if (key === 'name') {
            tinName = value;
          }
        });
        vm.tins.tinAndNameList.push({
          tin: tinTin,
          name: tinName
        });
        vm.tins.tinList.push(tinTin);
        vm.tins.groupNameList.push(tinName);
      });
    }

    function getTinToEdit(passedInId) {
      var dataObj = {
        id: passedInId
      };
      DataSvc.tins.ById.get(dataObj, function(tin) {
        populateTinToEdit(tin);
      });
    }

    function populateTinToEdit(tin) {
      vm.tins.selected.name = tin.name;
      vm.tins.selected.tin = tin.tin;
      vm.tins.selected.pres = tin.pres;
      vm.tins.selected.deactivate = !tin.active;
      vm.tins.selected.pres = $filter('orderBy')(vm.tins.selected.pres, function(pre) {
        var dateTime = new Date(pre.effDate).getTime();
        return dateTime;
      }, true); //sort reverse by effDate
      angular.forEach(vm.tins.selected.pres, function(pre, key) {
        pre.remove = false;
        pre.showInvalid = false;
      });
      originalTinPopulatedObject = angular.copy(vm.tins.selected); //defined at top of controller and used in the checkState fn
    }

    function restoreFormattedDate(date) {
      var returnDate = date;
      if (date.length === 10 && moment(date).isValid() && date.charAt(0) !== 0) {
        return date;
      }
      if (returnDate.length === 8 && returnDate.charAt(0) === '0') { //the mask is padding the year with a zero at the beginning
        returnDate = returnDate.substring(1);
      }
      if (returnDate.length === 8) {
        returnDate = date.substr(0, 4) + '-' + date.substr(4, 2) + '-' + date.substr(6, 2);
      }
      if (!moment(returnDate).isValid()) {
        $log.debug('invalid date:: ' + returnDate);
      }
      return returnDate;
    }

    //validation helper function
    function checkTinInvalidState() {
      var tinEmptyNotInvalid = false,
          tinInvalidNotEmpty = false;

      if (!angular.isUndefined(vm.manageTinForm.tinInput)) {
        var tinModelVal = vm.manageTinForm.tinInput.$modelValue;

        tinHasEmptyModel = angular.isUndefined(tinModelVal) || tinModelVal === '';
        tinIsDirtyInput = vm.manageTinForm.tinInput.$dirty;

        isValidTinPattern = validTinPattern.test(tinModelVal);

        tinEmptyNotInvalid = tinHasEmptyModel && tinIsDirtyInput;

        tinInvalidNotEmpty = !tinHasEmptyModel && tinIsDirtyInput && (isDuplicateTin || !isValidTinPattern);
        //vm.manageTinForm.tinInput.$setValidity('required', !isEmptyNotInvalid); //counter-intuitive, but if the input is "empty" (and in a required state), set validity of 'required' to false

        vm.manageTinForm.tinInput.$setValidity('validState', !tinInvalidNotEmpty); //sounds counter-intuitive, but if the input is 'invalid', set validity of 'validState' to false
      }

      showInvalidTin = tinInvalidNotEmpty;
      showRequiredTin = tinEmptyNotInvalid;
    }

    function checkNameInvalidState() {
      if (!angular.isUndefined(vm.manageTinForm.groupName)) {
        var nameModelVal = vm.manageTinForm.groupName.$modelValue,
            nameHasEmptyModel = angular.isUndefined(nameModelVal) || nameModelVal === '',
            nameIsDirtyInput = vm.manageTinForm.groupName.$dirty,
            isInvalidName = !nameHasEmptyModel && nameIsDirtyInput && isDuplicateGroupName;
        vm.manageTinForm.groupName.$setValidity('validState', !isInvalidName);//sounds counter-intuitive, but if the input is 'invalid', set validity of 'validState' to false
        showRequiredName = nameHasEmptyModel && nameIsDirtyInput;
        showInvalidName = !nameHasEmptyModel && nameIsDirtyInput && isDuplicateGroupName;
      }
    }
  }

}());
