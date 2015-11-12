'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.controller:HomeCtrl
 * @description
 * # HomeCtrl
 * Controller of the riskShareApp
 */

(function () {

  angular.module('riskShareApp').controller('HomeCtrl', HomeCtrl);

  HomeCtrl.$inject = ['UserSvc', '$location', '$rootScope', '$log'];

  function HomeCtrl(UserSvc, $location, $rootScope, $log) {
    var originalRolesArr = [],
        reportsMgmtKey = 0,
        entityAdminKey = 0,
        vm = this;

    if (originalRolesArr.length === 0) {
      UserSvc.getUserRoles().then(function(result){
        if (angular.isArray(result) && result.length > 1) {
          originalRolesArr = result;
          UserSvc.setUserKey('originalRoles', result);
          setUserRoleKeys(result);
        } else {
          UserSvc.getUser('originalRoles').then(function(result){
            $log.debug('originalRolesArray from storage:: ');
            $log.debug(result);
            if (angular.isString(result)) {
              result = angular.fromJson(result);
            }
            if (result && angular.isArray(result)) {
              originalRolesArr = result;
              //UserSvc.setUserKey('roles', originalRolesArr);
              setUserRoleKeys(originalRolesArr);
            }
          }, function(rejection){
            $log.debug(rejection);
          }); 
        }
      });
    }

    function setUserRoleKeys(originalRolesArr) {
       angular.forEach(originalRolesArr, function(value, key){
        if (value.toLowerCase().indexOf('reportadmin') > -1) {
          reportsMgmtKey = key;
        }
        if (value.toLowerCase().indexOf('preadmin') > -1) {
          entityAdminKey = key;
        }
      });  
    }
   
    vm.chooseEntityAdmin = function() {
      selectRole(originalRolesArr[entityAdminKey]);
      $location.path('/entities/search');
    };

    vm.chooseReportAdmin = function() {
      selectRole(originalRolesArr[reportsMgmtKey]);
      $location.path('/reports/manage');
    };

    function selectRole(chosenRole) {
      var roleArrToSet = [];
      roleArrToSet.push(chosenRole);
      
      UserSvc.setUserKey('roles', angular.toJson(roleArrToSet));

      $log.debug('this is the ROOTSCOPE!!!');
      $log.debug($rootScope);
    }
  }

}());
