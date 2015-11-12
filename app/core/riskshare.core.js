'use strict';

/**
 * @ngdoc overview
 * @name riskShareAppCore
 * @description
 * # angularAppApp (original)
 *
 * Core module of the RiskShare application.
 */
angular
  .module('riskShareAppCore', [
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngDialog',
    'modelOptions',
    'pasvaz.bindonce',
    'ui.validate',
    'ui.select',
    'ui.mask',
    'ui.jq',
    'customTabs',
    'pretty-checkable',
    'angularSpinner',
    'rt.debounce',
    'services.core.Authentication',
    'services.core.AuthInterceptor',
    'services.core.CheckSecurity',
    'services.core.HealthCheck',
    'services.core.Data',
    'services.core.Date',
    'services.core.User',
    'services.core.Menu',
    'services.Messages',
    'services.NavMain',
    'services.core.Config',
    'services.core.RouteChange',
    'services.core.Utils',
    'services.core.Validation',
    'services.core.Timeout'
  ]);
