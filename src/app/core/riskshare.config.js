'use strict';

/**
 * @ngdoc overview
 * @name riskShareAppConfig
 * @description
 * # angularAppApp (original)
 *
 * Config of the RiskShare application.
 */

(function() {

  angular.module('riskShareAppCore')
    .config(['CoreConfigSvcProvider', 'CORE_ROUTE_CONFIGS', 'REPORTS_ROUTE_CONFIGS', 'ENTITIES_ROUTE_CONFIGS', configFn])
    .config(['ngDialogProvider', ngDialogConfigFn])
    .config(['$provide', decorateNgRequiredFn]);

  function configFn(CoreConfigSvcProvider, CORE_ROUTE_CONFIGS, REPORTS_ROUTE_CONFIGS, ENTITIES_ROUTE_CONFIGS) {
    var routesArray = CORE_ROUTE_CONFIGS.concat(REPORTS_ROUTE_CONFIGS, ENTITIES_ROUTE_CONFIGS);

    CoreConfigSvcProvider.pushInterceptors();
    CoreConfigSvcProvider.setDefaults();
    CoreConfigSvcProvider.defineRoutes(routesArray);
    CoreConfigSvcProvider.disableLogging(true); //disables debug logging for prod when set to true
  }

  function ngDialogConfigFn(ngDialogProvider) {
    ngDialogProvider.setDefaults({
      className: 'ngdialog-theme-default',
      showClose: false,
      closeByEscape: false
    });
  }

  function decorateNgRequiredFn($provide){
    $provide.decorator('ngRequiredDirective', ['$delegate', function($delegate) {
      var theNgRequiredDirective = $delegate[0],
          directiveLink = theNgRequiredDirective.link;

      theNgRequiredDirective.compile = function() {
        return function($scope, $element, $attrs) {
          directiveLink.apply(this, arguments);
          var thisElm = $element[0];
          if (!angular.isUndefined(thisElm.setCustomValidity)) {
            thisElm.setCustomValidity('This field is required');
          }
        };
      };

      return $delegate;
    }]);
  } 

}());
