'use strict';

/**
 * @ngdoc overview
 * @name EntitiesConstants
 * @description
 * Entities
 * Constants of the RiskShare application.
 */

(function() {

  angular.module('riskShareAppCore')
    .constant({
      'ENTITIES_ROUTE_CONFIGS': [{
        url: '/entities/search',
        config: {
          templateUrl: 'entities/search.html',
          controller: 'EntitiesSearchCtrl',
          controllerAs: 'entitySearch',
          settings: {
            menu: {
              type: 'entities',
              num: 1,
              path: '#/entities/search',
              title: 'Search'
            },
            loginRequired: true,
            roles: ['int.PreAdmin'],
            title: 'Search'
          }
        }
      }, {
        url: '/entities/tins/create',
        config: {
          templateUrl: 'entities/tins/manage.html',
          controller: 'TinManageCtrl',
          controllerAs: 'tinManage',
          resolve: {
            ctrlOptions: function() {
              return {
                isTinCreate: true
              };
            }
          },
          settings: {
            menu: {
              type: 'entities',
              num: 3,
              path: '#/entities/tins/create',
              title: 'Add a TIN'
            },
            loginRequired: true,
            roles: ['int.PreAdmin'],
            title: 'TIN/Group'
          }
        }
      }, {
        url: '/entities/tins/edit',
        config: {
          templateUrl: 'entities/tins/manage.html',
          controller: 'TinManageCtrl',
          controllerAs: 'tinManage',
          resolve: {
            ctrlOptions: function() {
              return {
                isTinCreate: false
              };
            }
          },
          settings: {
            loginRequired: true,
            roles: ['int.PreAdmin'],
            title: 'TIN/Group'
          }
        }
      }, {
        url: '/entities/pres/create',
        config: {
          templateUrl: 'entities/pres/manage.html',
          controller: 'PreManageCtrl',
          controllerAs: 'preManage',
          resolve: {
            ctrlOptions: function() {
              return {
                isPreCreate: true
              };
            }
          },
          settings: {
            menu: {
              type: 'entities',
              num: 2,
              path: '#/entities/pres/create',
              title: 'Create new entity'
            },
            loginRequired: true,
            roles: ['int.PreAdmin'],
            title: 'Provider entity'
          }
        }
      }, {
        url: '/entities/pres/edit',
        config: {
          templateUrl: 'entities/pres/manage.html',
          controller: 'PreManageCtrl',
          controllerAs: 'preManage',
          resolve: {
            ctrlOptions: function() {
              return {
                isPreCreate: false
              };
            }
          },
          settings: {
            loginRequired: true,
            roles: ['int.PreAdmin'],
            title: 'Provider entity'
          }
        }
      }, {
        url: '/entities/hs/create',
        config: {
          templateUrl: 'entities/healthsystems/manage.html',
          controller: 'HsManageCtrl',
          controllerAs: 'hsManage',
          resolve: {
            ctrlOptions: function() {
              return {
                isHsCreate: true
              };
            }
          },
          settings: {
            menu: {
              type: 'entities',
              num: 4,
              path: '#/entities/hs/create',
              title: 'Add a health system'
            },
            loginRequired: true,
            roles: ['int.PreAdmin'],
            title: 'Health system'
          }
        }
      }, {
        url: '/entities/hs/edit',
        config: {
          templateUrl: 'entities/healthsystems/manage.html',
          controller: 'HsManageCtrl',
          controllerAs: 'hsManage',
          resolve: {
            ctrlOptions: function() {
              return {
                isHsCreate: false
              };
            }
          },
          settings: {
            loginRequired: true,
            roles: ['int.PreAdmin'],
            title: 'Health system'
          }
        }
      }]
    });
}());
