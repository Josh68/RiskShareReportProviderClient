'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:Validation
 * @description
 * # Validation
 * Service of the riskShareApp
 */

//Client side validation strings 

(function() {

  angular
    .module('services.core.Validation', [])
    .factory('ValidationSvc', ValidationSvc);

  ValidationSvc.$inject = ['$log'];

  function ValidationSvc($log) {

    var service = {
      getValidationString: getValidationString
    };

    return service;

    ////////////

    function getValidationString(status) {
      //console.log('hit validation service');
      var errors = [];
      if(status.required === true) {
        errors.push(status.field + ' password field is required.');
      } else if(status.minlength === true) {
        errors.push(status.field + ' password must be at least six characters long.');
      } else if(status.maxlength === true) {
        errors.push(status.field + ' password cannot be longer than 15 characters.');
      } else if(status.match === true) {
        errors.push('Both instances of new password must match.');
      }
      return errors;
      /*
      if (typeof errors !== 'undefined' && errors.length > 0) {
        return errors;
      }
      */
    }

  }
}());
