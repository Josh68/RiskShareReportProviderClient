'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:HsManage
 * @description
 * # HsManage
 * Controller of the riskShareApp
 */

(function() {

  angular.module('riskShareAppEntities').controller('HsManageCtrl', HsManage);

  HsManage.$inject = ['MessagesSvc', 'ctrlOptions', 'DataSvc', '$filter', '$location', '$scope', '$routeParams', '$log', 'CONTENT', 'EntitiesSvc', 'debounce'];

  function HsManage(MessagesSvc, ctrlOptions, DataSvc, $filter, $location, $scope, $routeParams, $log, CONTENT, EntitiesSvc, debounce) {
    var vm = this,
      originalHsPopulatedObject,
      queryParams = $location.search(),
      hsHasEmptyModel = false,
      hsIsDirtyInput = false,
      hsShowInvalidVar = false,
      hsShowRequiredVar = false;

    vm.formSubmitted = false;

    /**
     * Initial data structure to satisfy Form fields and relationship.
     * 'showInvalid' method is for to determine the duplicate name and the change of active state in order to disable the possibility of illegal submit.
     */
    vm.healthsystems = {
      list: [], //empty list to be populated on init
      selected: {
        name: '',
        id: '',
        pres: [],
        deactivate: false,
        url: ''
      }
    };

    vm.hsFormData = {
      showInvalid: false,
      showRequired: false,
      checkValidity: function() {
        checkHsInvalidState(); //sets all necessary variables for showing or hiding errors
        vm.hsFormData.showInvalid = hsShowInvalidVar;
        vm.hsFormData.showRequired = hsShowRequiredVar;
      },
      hideErrors: function() {
        debounce(100, checkHsInvalidState()); //sets all necessary variables for showing or hiding errors
        if (!hsHasEmptyModel && !hsShowInvalidVar && hsIsDirtyInput) {
          vm.hsFormData.showInvalid = hsShowInvalidVar;
          vm.hsFormData.showRequired = hsShowRequiredVar;
          return true;
        }
        if (!hsHasEmptyModel && hsShowInvalidVar && hsIsDirtyInput) {
          //vm.hsFormData.showInvalid = hsShowInvalidVar;
          vm.hsFormData.showRequired = hsShowRequiredVar;
        }
        return false;
      }
    };

    // Flag to differentiate between create and edit fields used in view Form. 
    vm.showCreate = ctrlOptions.isHsCreate;
    /**
     * Jumping to PRE Edit page.
     */
    vm.editPre = function(idToEdit) {
      $location.url('/entities/pres/edit/?id=' + idToEdit);
    };

    /**
     * Method call for submitting a HS create.
     */
    vm.create = function() {
      $log.debug(vm.manageHsForm);
      var dataObj = {
        name: vm.healthsystems.selected.name
      };
      DataSvc.hs.Create.save(dataObj, function(response) {
        hsCreated(response);
        getHs();
      });
    };

    function hsCreated(response) {
      $log.debug(response);

      if (!angular.isUndefined(vm.manageHsForm)) {
        vm.manageHsForm.$setPristine();
      }

      if (!angular.isUndefined(response.createHs.infoMsg)) {
        MessagesSvc.registerInfoMsg(response.createHs.infoMsg);
      }
      resetManageHsForm();
    }

    /**
     * Method call for submitting a HS update.
     */
    vm.update = function() {
      vm.formSubmitted = true; //prevent double submit
      $log.debug(vm.manageHsForm);
      var dataObj = {
        name: vm.healthsystems.selected.name,
        active: !vm.healthsystems.selected.deactivate

      };
      DataSvc.hs.Save.update({
        id: $routeParams.id
      }, dataObj, function(response) {
        if (!angular.isUndefined(response.updateHs.infoMsg)) {
          MessagesSvc.registerInfoMsg(response.updateHs.infoMsg);
        }
        vm.formSubmitted = false; //allow submit again
        populateHsToEdit(response.updateHs);
        getHs();
      });
    };

    vm.returnToSearch = function() {
      EntitiesSvc.returnToSearch();
    };

    /**
     * Full load of current existing Health Systems and populate the 'initial data'. 
     */
    function getHs() {
      DataSvc.hs.FilteredAll.get(function(response) {
        vm.healthsystems.list = response.hs;
      });
    }

    /**
     * Method loads HS by ID in order to edit an existing Health System.
     * Facilitates data load for specific HS and sets the 'initial data'.
     * @param passedInId Health System ID.
     */
    function getHsToEdit(passedInId) {
      var dataObj = {
        id: passedInId
      };
      DataSvc.hs.ById.get(dataObj, function(hs) {
        populateHsToEdit(hs);
      });
    }

    /**
     * Utility method that takes care for update the current selected HS that is in 'edit mode'.
     */
    function populateHsToEdit(hs) {
      vm.healthsystems.selected.id = hs.id;
      vm.healthsystems.selected.name = hs.name;
      vm.healthsystems.selected.pres = angular.isArray(hs.pres) ? hs.pres : [];
      vm.healthsystems.selected.url = hs.url;
      if (hs.active === 'true') {
        vm.healthsystems.selected.deactivate = false;
      } else if (hs.active === 'false') {
        vm.healthsystems.selected.deactivate = true;
      }
      vm.healthsystems.selected.pres = $filter('orderBy')(vm.healthsystems.selected.pres, function(pre) {
        return pre.name;
      });
      originalHsPopulatedObject = angular.copy(vm.healthsystems.selected); //defined at top of controller and used in the checkState fn
    }

    /**
     * Utility Method that takes care of resetting the form. Used for after submitting a create. 
     * The original HsPopulatedObject is in this case always empty. 
     */
    function resetManageHsForm() {
      vm.healthsystems.selected = originalHsPopulatedObject;
      if (!angular.isUndefined(vm.manageHsForm)) {
        vm.manageHsForm.$setPristine();
      }
    }

    function checkHsInvalidState() {
      if (!angular.isUndefined(vm.manageHsForm.hsNameInput)) {
        var selectedActive = vm.healthsystems.selected.deactivate;
        hsHasEmptyModel = angular.isUndefined(vm.manageHsForm.hsNameInput.$modelValue) || vm.manageHsForm.hsNameInput.$modelValue === '';
        hsIsDirtyInput = vm.manageHsForm.hsNameInput.$dirty;
        hsShowInvalidVar = false; //reset on each check
        hsShowRequiredVar = false; //reset on each check
        
        vm.manageHsForm.hsNameInput.$setValidity('notDuplicate', true); //reset on each check

        if (angular.isString(vm.healthsystems.selected.name)) {
          var selectedName = vm.healthsystems.selected.name.toLowerCase();
          
          angular.forEach(vm.healthsystems.list, function(hs, key) {
            if (!angular.isString(hs.name)) {
              hs.name = '';
            }
            var iterName = hs.name.toLowerCase();
            if (iterName === selectedName && !hsHasEmptyModel) {
              if (hs.id !== vm.healthsystems.selected.id || (originalHsPopulatedObject.deactivate === selectedActive && hs.id === vm.healthsystems.selected.id)) {
                vm.manageHsForm.hsNameInput.$setValidity('notDuplicate', false);
                hsShowInvalidVar = true;
              }
            }
          });
        }
        if (hsHasEmptyModel && hsIsDirtyInput && !hsShowInvalidVar) {
          hsShowRequiredVar = true;
        }
      }
    }

    getHs(); //call to get all health systems (with no filter) on view load

    /**
     * Method called when landing to this controller from the 'outside' in order to edit an existing Health System.
     * Facilitates data load for specific HS and sets the 'initial data'.
     */
    if (queryParams.id && typeof queryParams.id === 'string') { //if there's a query string with an ID and it has a value, this is coming from search and passing an ID to edit, so call for the HS's details
      getHsToEdit(queryParams.id);
    }


  }

}());
