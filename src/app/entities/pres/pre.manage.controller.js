'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:PreManage
 * @description
 * # PreManage
 * Controller of the riskShareApp
 */

(function() {

  angular.module('riskShareAppEntities').controller('PreManageCtrl', PreManage);

  PreManage.$inject = ['DataSvc', '$scope', '$rootScope', '$routeParams', '$location', 'ctrlOptions', '$log', '$q', '$timeout', 'CONTENT', 'MessagesSvc', 'UtilsSvc', 'EntitiesSvc', 'TYPEAHEAD_MIN_CHARS'];

  function PreManage(DataSvc, $scope, $rootScope, $routeParams, $location, ctrlOptions, $log, $q, $timeout, CONTENT, MessagesSvc, UtilsSvc, EntitiesSvc, TYPEAHEAD_MIN_CHARS) {
    var vm = this,
      usePreNameForHs = false,
      originalSelectedTin,
      originalSelectedHs,
      originalSelectedPre,
      originalTinArray,
      queryParams = $location.search(),
      newHsPlaceholder = '--New--',
      usePreForHsPlaceholder = '--New (use PRE name)--';

    vm.typeaheadMinChars = TYPEAHEAD_MIN_CHARS;
    vm.tinInputPartial = 'entities/pres/tinselect.html';
    vm.tinInputDateRangePartial = 'entities/pres/tinselectdates.html';
    vm.enableTinInputDates = false;
    vm.showReturnToSearch = false;

    vm.showHsInput = false; //bool to control the display of the HS name input

    vm.formSubmitted = false; //set up bool to prevent double submits

    vm.modaDateFormat = CONTENT.modaDateFormat;
    vm.originalDateFormat = CONTENT.originalDateFormat;

    //booleans to control whether this is pre creation or update. value comes from route config resolve functions
    vm.showCreate = ctrlOptions.isPreCreate;
    vm.showEdit = !ctrlOptions.isPreCreate;

    vm.checkState = function() { //triggered on keyup and mouseup on the form, check the state of the form
      //TODO - in other controllers, this check is done using a clone/copy of the original state, instead of checks for empty inputs, and this approach may not be working
      var formIsUnchanged = true,
        preIsUnchanged = true,
        hsIsUnchanged = true,
        hsNewNameIsBlank = false,
        tinArrayIsUnchanged = angular.equals(originalTinArray, vm.tins.selectedArray);

      if (!angular.isUndefined(vm.managePreForm.hsName)) {
        hsIsUnchanged = vm.showCreate ? angular.equals(originalSelectedHs, vm.healthsystems.selected) : angular.equals(originalSelectedHs.name, vm.managePreForm.hsName.$viewValue);
        // if (!hsIsUnchanged) { //if the healthsystem name has been changed

        // }
        if (!angular.isUndefined(vm.managePreForm.hsSelect)) {
          if (!angular.isUndefined(vm.managePreForm.hsSelect.$modelValue)) {
            var hsSelectModel = vm.managePreForm.hsSelect.$modelValue;
            if (hsSelectModel.hasOwnProperty('populateHs')) {
              if (hsSelectModel.populateHs) {
                if (vm.managePreForm.hsName.$modelValue === '' || !vm.managePreForm.hsName.$modelValue) {
                  hsNewNameIsBlank = true;
                }
              }
            }
          } else {
            hsNewNameIsBlank = true;
          }
        }
      }

      if (!angular.isUndefined(vm.managePreForm.preName)) {
        preIsUnchanged = vm.showCreate ? angular.equals(originalSelectedPre, vm.pres.selected) : angular.equals(originalSelectedPre.name, vm.managePreForm.preName.$viewValue);
      }

      if (!angular.isUndefined(vm.managePreForm)) {
        if (vm.managePreForm.preName.$valid && vm.managePreForm.hsName.$valid && vm.tins.selectedArray.length > 0) { //check validity of contained data
          vm.managePreForm.$setValidity('validState', true);
        }
      }

      if ((!preIsUnchanged || !hsIsUnchanged || !tinArrayIsUnchanged) && !hsNewNameIsBlank) {
        formIsUnchanged = false;
      }

      //set formReverted if everything's empty
      vm.managePreFormData.formReverted = formIsUnchanged;
    };

    //the pres object for the controller
    vm.pres = {
      selected: {
        name: '', // This will hold the selected item
        id: '',
        url: ''
      },
      onItemSelected: function() { // this gets executed when an item is selected
        $log.debug('selected name = ' + vm.pres.selected.name);
        $log.debug('selected id = ' + vm.pres.selected.id);
        vm.pres.selected.output = vm.pres.selected.id.toString().length > 0 ? vm.pres.selected.name + ' - ' + vm.pres.selected.id : vm.pres.selected.name;
      }
    };

    vm.healthsystems = {};

    vm.tins = {
      list: [],
      // including this object which is the model for the select breaks placeholder
      // try without defining the selected property up-front
      // selected: {
      //   name: '',
      //   tin: '',
      //   id: '',
      //   nextEffDate: '',
      //   nextEndDate: '',
      //   url: ''
      // },
      selectedArray: [],
      placeholder: 'Enter TIN or group name',
      onItemSelected: function() {
        $log.debug('called when TIN is selected for new PRE');
        $log.debug(vm.tins.selected);
        vm.enableTinInputDates = true;
        vm.tins.list = [vm.tins.selected];
        vm.tins.addTin();
        //vm.tins.selected.tinAndName = vm.tins.selected.name.length > 0 ? vm.tins.selected.tin + ' - ' + vm.tins.selected.name : vm.tins.selected.tin;
        //vm.tins.selected.tinAndName = angular.isString(vm.tins.selected.name) && vm.tins.selected.name.length > 0 ? vm.tins.selected.tin + ' - ' + vm.tins.selected.name : vm.tins.selected.tin.length > 0 ? vm.tins.selected.tin : '';
      },
      onTypeAhead: function() {
        var tinString = vm.tins.selected.tin ? vm.tins.selected.tin.toString() : '';
        //TODO - if we get the filtered search working correctly, try this again
        //this is to try only fetching TINs on typeahead, after 3 chars are entered
        return getFilteredTins(tinString);
      },
      addTin: function() {
        var selectedTinCopy = angular.copy(vm.tins.selected);
        angular.forEach(selectedTinCopy, function(value, tinProp) {
          if (tinProp === 'nextEffDate') {
            selectedTinCopy.effDate = value;
          }
          if (tinProp === 'nextEndDate') {
            selectedTinCopy.endDate = value;
          }
        });
        $log.debug(vm.tins.selectedArray);
        vm.tins.selectedArray.push(selectedTinCopy);
        $log.debug(vm.tins.selectedArray);
        //for AJAXified input
        vm.tins.selected = {
          //name: vm.tins.placeholder
        };
        //vm.tins.selected = angular.copy(originalSelectedTin); //reset the input
        vm.tins.list = []; //reset the list which needs to be repopulated by another ajax request
        //for AJAXifired input
        vm.enableTinInputDates = false;
        vm.checkState();
      },
      removeTin: function(tin) {
        $log.debug(tin);
        $log.debug(vm.tins.selectedArray);
        angular.forEach(vm.tins.selectedArray, function(tinObj, key) {
          if (tin === tinObj.tin) {
            vm.tins.selectedArray.splice(key, 1);
          }
        });
        $log.debug(vm.tins.selectedArray);
        vm.checkState();
      }
    };

    //on page load, these values are set for dirty comparison later
    //when loading a PRE to edit, some or all of these will be overwritten with supplied values
    originalSelectedTin = angular.copy(vm.tins.selected);
    originalSelectedPre = angular.copy(vm.pres.selected);
    originalSelectedHs = angular.copy(vm.healthsystems.selected);
    originalTinArray = angular.copy(vm.tins.selectedArray);

    vm.resetForm = function() {
      vm.tins.selected = angular.copy(originalSelectedTin);
      vm.tins.selectedArray = [];
      vm.healthsystems.selected = {};
      vm.pres.selected = angular.copy(originalSelectedPre);
    };

    vm.canReset = function() {
      var notOriginalTin = !angular.equals(vm.tins.selected, originalSelectedTin),
        notOriginalPre = !angular.equals(vm.pres.selected, originalSelectedPre),
        notOriginalTinArray = !angular.equals(vm.tins.selectedArray, []),
        notOriginalHsObj = !angular.equals(vm.healthsystems.selected, {});
      return notOriginalTin && notOriginalPre && notOriginalTinArray && notOriginalHsObj;
    };

    //object to hold validations and related stuff for the form, beyond the formController
    vm.managePreFormData = {
      formReverted: false,
      hsName: {
        showRequired: false,
        showInvalid: false,
        checkValidity: function() {
          var validityObj = checkHsValidity();
          vm.managePreFormData.hsName.showInvalid = validityObj.isInvalid;
          vm.managePreFormData.hsName.showRequired = validityObj.isEmpty;
        },
        hideErrors: function() {
          var validityObj = checkHsValidity();
          if (validityObj.isEmpty && !validityObj.isInvalid) {
            vm.managePreFormData.hsName.showInvalid = validityObj.isInvalid;
            vm.managePreFormData.hsName.showRequired = validityObj.isEmpty;
          }
          if (validityObj.isInvalid) {
            vm.managePreFormData.hsName.showRequired = validityObj.isEmpty;
          }
          return !validityObj.isEmpty && !validityObj.isInvalid;
        }
      },
      pre: {
        isOriginalPopulatedName: false,
        showInvalid: false,
        showRequired: false,
        checkValidity: function() {
          var validityObj = checkPreValidity(); //helper function, triggered here on blur
          vm.managePreFormData.pre.showRequired = validityObj.isEmpty && !validityObj.isInvalid;
          vm.managePreFormData.pre.showInvalid = validityObj.isInvalid && !validityObj.isEmpty;
        },
        hideErrors: function() { //helper function triggered here on keyup (to hide errors)
          var validityObj = checkPreValidity();
          if (validityObj.isEmpty && !validityObj.isInvalid) {
            vm.managePreFormData.pre.showInvalid = validityObj.isInvalid;
            vm.managePreFormData.pre.showRequired = validityObj.isEmpty;
          }
          if (validityObj.isInvalid) {
            vm.managePreFormData.pre.showRequired = validityObj.isEmpty;
          }
          return !validityObj.isEmpty && !validityObj.isInvalid;
        }
      }
    };

    vm.refreshTins = function(searchString) {
      if (angular.isString(searchString)) {
        if (searchString.length >= 3) {
          var dataObj = {
            tin: searchString
          };
          DataSvc.tins.FilteredAll.get(dataObj, function(response) {
            createTinList(response);
          });
        }
      }
    };

    //the function called when an item is chosen in the the HS select
    vm.onHsSelect = function($item, $model) {
      if ($item.hasOwnProperty('newNameVal')) {
        if ($item.newNameVal !== '') {
            vm.showHsInput = true;
          if ($item.newNameVal === 'usePreName') {
            usePreNameForHs = true;
            vm.healthsystems.selected = {
              populateHs: true,
              name: vm.pres.selected.name,
              placeholder: usePreForHsPlaceholder
            };
          } else {
            usePreNameForHs = false;
            vm.healthsystems.selected = {
              populateHs: true,
              placeholder: newHsPlaceholder
            };
          }
          if (!angular.isUndefined(vm.managePreForm.hsName)) {
            vm.managePreForm.hsName.$setValidity('validState', true);
            vm.managePreForm.hsName.$setPristine();
          }
        } else {
          populateHSFromList();
        }
      } else {
        populateHSFromList();
      }

      function populateHSFromList() {
        vm.healthsystems.selected = $item; //apply the selected item to the select
        vm.healthsystems.selected.populateHs = false;
        usePreNameForHs = false;
        vm.showHsInput = false;
      }
    };

    vm.onTinTypeAhead = function($item, $model) {
      if (angular.isString($item)) {
        if ($item.length >= 3) {
          $log.debug($item);
          $log.debug($model);
          getFilteredTins($item);
        }
        if ($item.length < 3) { //reset the list if there are fewer than 3 characters
          vm.tins.list = [];
        }
      }
    };

    vm.onPreTypeAhead = function() {
      var deferred = $q.defer();
      if (!angular.isUndefined(vm.managePreForm.preName)) {
        var preModelVal = vm.managePreForm.preName.$modelValue;
        if (angular.isString(preModelVal)) {
          getFilteredPres(preModelVal).then(function(preList) {
            deferred.resolve(preList.pres);
          });
        }
      }
      return deferred.promise;
    };

    vm.create = function() {
      vm.formSubmitted = true; //prevent double submit

      var dataObj = {};
      dataObj.preName = vm.pres.selected.name;
      dataObj.hsName = vm.healthsystems.selected.name;
      dataObj.hsId = vm.healthsystems.selected.id;
      dataObj.tins = angular.copy(vm.tins.selectedArray);

      cleanUpTins.call({
        method: 'create'
      }, dataObj.tins);

      DataSvc.pres.Create.save(dataObj, function(response) {
        if (response.createPre) {
          preCreated(response.createPre);
        } else if (response.errorMsg) {
          MessagesSvc.registerErrors(response.errorMsg);
        }
        vm.formSubmitted = false; //allow the form to be submitted again
      }, function(reason) {
        $log.debug('Problem creating new PRE because of issue:: ');
        $log.debug(reason);
        vm.formSubmitted = false; //allow the form to be submitted again
      });
    };

    vm.update = function() {
      var dataObj = {
          preName: vm.pres.selected.name
        },
        newTinsArray = angular.copy(vm.tins.selectedArray);

      vm.formSubmitted = true; //prevent double submit

      if (vm.healthsystems.selected.hasOwnProperty('id')) {
        dataObj.hsId = vm.healthsystems.selected.id;
      }

      if (vm.healthsystems.selected.hasOwnProperty('name')) {
        dataObj.hsName = vm.healthsystems.selected.name;
      }

      cleanUpTins.call({
        method: 'update'
      }, newTinsArray);

      angular.forEach(newTinsArray, function(tin, key) {
        tin = UtilsSvc.stringifyObjData(tin);
      });

      dataObj.tins = newTinsArray;

      DataSvc.pres.Save.update({
        id: $routeParams.id
      }, dataObj, function(response) {
        if (response.updatePre) {
          preUpdated(response.updatePre);
        }
        //TODO - evaluate whether this error registration is needed or correct
        if (response.errorMsg) {
          MessagesSvc.registerErrors(response.errorMsg);
        }
        vm.formSubmitted = false; //allow submission again
      }, function(reason) {
        $log.debug('PRE could not be updated because of reason:: ');
        $log.debug(reason);
        vm.formSubmitted = false; //allow submission again
      });
    };

    vm.editTin = function(id) {
      $location.url('/entities/tins/edit/?id=' + id);
    };

    vm.returnToSearch = function() {
      EntitiesSvc.returnToSearch();
    };

    //WATCHES
    $scope.$watch(function() {
      return vm.pres.selected.name;
    }, function(newVal, oldVal) {
      if (!angular.equals(newVal, oldVal)) {
        if (usePreNameForHs) {
          vm.healthsystems.selected.name = newVal;
        }
      }
    });

    //DATA CALLS!!

    //make a call to get the list of all pres

    function getPres() {
      DataSvc.pres.FilteredAll.get(function(response) { //TODO - try other approaches. Move this into the typeahead with ajax calls on keyup? prefetch and store lists in local storage?
        createPreList(response);
      });
    }

    function getFilteredPres(inputString) {
      var dataObj = {
        name: inputString
      },
      getFilteredPresCall = DataSvc.pres.FilteredAll.get(dataObj, function(presObj) {
        createPreList(presObj);
      }),
      getFilteredPresCallPromise = getFilteredPresCall.$promise;
      return getFilteredPresCallPromise;
    }

    function getTins() {
      DataSvc.tins.FilteredAll.get(function(response) { //TODO - try other approaches. Move this into the typeahead with ajax calls on keyup? prefetch and store lists in local storage?
        createTinList(response);
      });
    }

    function getFilteredTins(inputString) {
      var dataObj = {
          tin: inputString
        },
        tempTinArray = [],
        getTinsCall = DataSvc.tins.FilteredAll.get(dataObj, function(response) {
          var tins = !angular.isArray(response.tins) ? [] : response.tins,
            selectedTinNumberArray = [];

          angular.forEach(vm.tins.selectedArray, function(tin, key) {
            selectedTinNumberArray.push(tin.tin);
          });

          angular.forEach(tins, function(tin, key) {
            var tinNumber = tin.tin,
              isDupe = selectedTinNumberArray.indexOf(tinNumber) > -1;
            if (!isDupe) {
              tempTinArray.push(tin);
            }
          });

          vm.tins.list = tempTinArray;

        }),
        getTinsCallPromise = getTinsCall.$promise;
      return getTinsCallPromise;
    }

    function getHs() {
      var dataObj = {
        active: true
      };
      
      DataSvc.hs.FilteredAll.get(dataObj, function(response) {
        createHsList(response);
      });
    }

    //call to get necessary lists of entities for the view
    //getPres(); //replacing this with the typeahead on keyup
    //getTins(); //replacing this with the typeahead on keyup
    getHs();

    //setup functions
    //set the available pre list to the returned data
    function createPreList(preList) {
      var preListArr = [];
      if (preList.hasOwnProperty('pres')) { //added checks for property and array before backend was amended to make entity properties always return an array (optionally empty)
        if (angular.isArray(preList.pres)) {
          preListArr = preList.pres;
        }
      }
      vm.pres.list = preListArr;
    }

    function createTinList(tinList) {
      var tinListArr = [];
      if (tinList.hasOwnProperty('tins')) { //added checks for property and array before backend was amended to make entity properties always return an array (optionally empty)
        if (angular.isArray(tinList.tins)) {
          tinListArr = tinList.tins;
        }
      }
      vm.tins.list = tinListArr;
    }

    function createHsList(hsList) {
      var hsListArr = [];
      if (hsList.hasOwnProperty('hs')) { //added checks for property and array before backend was amended to make entity properties always return an array (optionally empty)
        if (angular.isArray(hsList.hs)) {
          angular.forEach(hsList.hs, function(hs, key) {
            hs.newNameVal = ''; //these two properties will never be sent back, but are used to control the display and action of the hs name input
            hs.populateHs = false; //see above
          });
          hsListArr = hsList.hs;
        }
      }
      var newNameObj = {
          placeholder: newHsPlaceholder,
          name: '',
          populateHs: true,
          newNameVal: 'createHsName'
        },
        usePreNameObj = {
          placeholder: usePreForHsPlaceholder,
          name: vm.pres.selected.name,
          populateHs: true,
          newNameVal: 'usePreName'
        };
      vm.healthsystems.list = hsListArr;
      vm.healthsystems.list.unshift(usePreNameObj);
      vm.healthsystems.list.unshift(newNameObj);
    }

    if (vm.showEdit) { //if this is a call to edit (from soearch or elsewhere)
      //populate the form, first checking for the appropriate query param (id)
      if (queryParams.id && typeof queryParams.id === 'string') { //if there's a query string with an ID and it has a value, this is coming from search and passing an ID to edit, so call for the TIN's details
        getPreToEdit(queryParams.id);
      }
    }

    //set up the page for Editing, coming from the search or another view where ID is passed as a param
    function getPreToEdit(preId) {
      var dataObj = {
        id: preId
      };
      DataSvc.pres.ById.get(dataObj, function(returnedPre) {
        populateFormForEdit(returnedPre);
      });
    }

    function populateFormForEdit(preToEdit) {
      vm.pres.selected = preToEdit;
      vm.healthsystems.selected = preToEdit.hs;
      vm.tins.selectedArray = preToEdit.tins;
      //reset the base values here, for determining whether the form has been changed
      originalSelectedHs = angular.copy(preToEdit.hs);
      originalSelectedPre = angular.copy(preToEdit);
      originalTinArray = angular.copy(preToEdit.tins);
      if (!angular.isUndefined(vm.managePreForm.preName)) {
        vm.managePreForm.preName.$setValidity('validState', true);
      }
      if (!angular.isUndefined(vm.managePreForm.hsName)) {
        vm.managePreForm.hsName.$setValidity('validState', true);
      }
      vm.checkState();
    }

    //create and update handlers

    function preCreated(response) {
      //set the form to $pristine, clear data, allow resubmission
      vm.formSubmitted = false; //allow form submit again
      vm.resetForm(); //reset data
      vm.managePreForm.$setPristine();
      if (response.infoMsg) {
        MessagesSvc.registerInfoMsg(response.infoMsg);
      }
    }

    function preUpdated(updatedPre) {
      //form submit is enabled in call to update
      vm.formSubmitted = false; // allow form submit again
      if (updatedPre.infoMsg) {
        MessagesSvc.registerInfoMsg(updatedPre.infoMsg);
      }
      // vm.pres.selected.name = response.name;
      // vm.healthsystems.selected = response.hs;
      // vm.tins.selectedArray = response.tins;
      populateFormForEdit(updatedPre);
    }

    //Client-side validation helpers

    function checkPreValidity() {
      var returnObj = {
          isInvalid: false,
          isEmpty: false
        },
        isDupe = false, //create an array that contains just PRE names from the list
        originalNameIsString = angular.isString(originalSelectedPre.name),
        selectedNameIsString = angular.isString(vm.pres.selected.name);

      vm.managePreFormData.pre.isOriginalPopulatedName = false; //reset before rechecking, below

      angular.forEach(vm.pres.list, function(pre, key) {
        if (angular.isString(pre.name) && angular.isString(vm.pres.selected.name)) {
          var lcPreName = pre.name.toLowerCase(),
            lcSelectedPreName = vm.pres.selected.name.toLowerCase();
          if (lcPreName === lcSelectedPreName) {
            isDupe = true;
          }
        }
      });

      if (vm.showEdit) {
        if (originalSelectedPre.hasOwnProperty('name') && originalNameIsString && selectedNameIsString) {
          if (originalSelectedPre.name !== '') {
            if (vm.pres.selected.name.toLowerCase() === originalSelectedPre.name.toLowerCase()) {
              vm.managePreFormData.pre.isOriginalPopulatedName = true;
            } else {
              vm.managePreFormData.pre.isOriginalPopulatedName = false;
            }
          }
        }
      }

      if (!angular.isUndefined(vm.managePreForm.preName)) {
        var isEmptyModelVal = angular.isUndefined(vm.managePreForm.preName.$modelValue) || vm.managePreForm.preName.$modelValue === '';
        returnObj.isInvalid = vm.showEdit ? !isEmptyModelVal && !vm.managePreFormData.pre.isOriginalPopulatedName && isDupe : !isEmptyModelVal && isDupe;
        
        vm.managePreForm.preName.$setValidity('validState', !returnObj.isInvalid); //counter-intuitive, but if the input is 'invalid', set validity of 'validState' to false

        returnObj.isEmpty = isEmptyModelVal && vm.managePreForm.preName.$dirty;
        //vm.managePreForm.hsName.$setValidity('required', !angular.isUndefined(vm.managePreForm.hsName.$modelValue)); //counter-intuitive, but if the input is "empty" (and in a required state), set validity of 'required' to false
      }

      return returnObj;
    }

    function checkHsValidity() { //helper for validity checks on the hs name input (not select)
      var returnObj = {
        isInvalid: false,
        isEmpty: false
      },
      isDupe;

      if (!angular.isUndefined(vm.managePreForm.hsName)) {
        var hsNameModelVal = vm.managePreForm.hsName.$modelValue,
          isEmptyModelVal = angular.isUndefined(hsNameModelVal) || hsNameModelVal === '',
          isEmptyVar = isEmptyModelVal && vm.managePreForm.hsName.$dirty,
          hsNameIsString = angular.isString(hsNameModelVal);
        
        //if (vm.showEdit) { //this is pre edit view

        vm.managePreForm.hsName.$setValidity('validState', true); //reset
        //basically, check if the new input is showing and make sure the hs name isn't one that's already in the list
        //should not depend on whether this is edit or create
        if (vm.showHsInput && !isEmptyVar) {
          if (hsNameIsString) {
            angular.forEach(vm.healthsystems.list, function(hs, key) {
              if (angular.isString(hs.name)) {
                if (angular.equals(hs.name.toLowerCase(), hsNameModelVal.toLowerCase())) {
                  isDupe = true;
                  vm.managePreForm.hsName.$setValidity('validState', false);
                }
              } 
            });
          }
        }
        //}
        // else { //this is pre create view
        //   vm.managePreForm.hsName.$setValidity('validState', true);
        // }

        returnObj.isInvalid = isDupe && !isEmptyVar;
        returnObj.isEmpty = isEmptyVar && !isDupe;

        vm.managePreForm.hsName.$setValidity('required', !returnObj.isEmpty);
        //vm.managePreForm.hsName.$setValidity('required', !angular.isUndefined(vm.managePreForm.hsName.$modelValue)); //counter-intuitive, but if the input is "empty" (and in a required state), set validity of 'required' to false
      }

      return returnObj;
    }

    //UTILILTY Functions
    function cleanUpTins(tins) { //TODO - make this an inverse method, whereby a config contains required properties and the function checks properties and deletes the ones not in the config
      var method = this.method, //jshint ignore:line
        isCreate = method === 'create';
      angular.forEach(tins, function(tin, key) {
        //rename nextDate properties - this should now be taken care of in the add function (add another)
        //tin.effDate = tin.nextEffDate; 
        //tin.endDate = tin.nextEndDate;  
        //remove unnecessary properties
        if (!angular.isUndefined(tin.nextEffDate)) {
          delete tin.nextEffDate;
        }
        if (!angular.isUndefined(tin.nextEndDate)) {
          delete tin.nextEndDate;
        }
        if (!angular.isUndefined(tin.errors)) {
          delete tin.errors;
        }
        if (!angular.isUndefined(tin.infoMsg)) {
          delete tin.infoMsg;
        }
        if (!angular.isUndefined(tin.associated)) {
          delete tin.associated;
        }
        if (!angular.isUndefined(tin.url)) {
          delete tin.url;
        }
        if (!angular.isUndefined(tin.name)) {
          delete tin.name;
        }
        if (!angular.isUndefined(tin.active)) {
          delete tin.active;
        }
        if (!angular.isUndefined(tin._uiSelectChoiceDisabled)) {
          delete tin._uiSelectChoiceDisabled;
        }
        if (!angular.isUndefined(tin.assocId) && isCreate) {
          delete tin.assocId;
        }
      });
      return tins;
    }

    $rootScope.$on('uis:close', function(event) {
      $log.debug(event);
    });

  }

}());
