'use strict';

/**
 * @ngdoc overview
 * @name riskShareReportsConstants
 * @description
 * Reports
 * Constants of the RiskShare application.
 */

(function() {

  angular.module('riskShareAppCore')
    .constant({
      'REPORTS_ROUTE_CONFIGS': [{
        url: '/reports/view',
        config: {
          templateUrl: 'reports/view/view.html',
          controller: 'ReportsViewCtrl',
          controllerAs: 'rptView',
          // resolve: {
          //   navReady: ['NavMainSvc', function(NavMainSvc) {
          //     return NavMainSvc.getNavIsReady(); //seeing if I can make sure the menu is ready before displaying first routes
          //   }
          // ]},
          settings: {
            menu: {
              type: 'reports',
              num: 3,
              path: '#/reports/view',
              title: 'Provider reports'
            },
            loginRequired: true,
            roles: ['ext.ProvContact', 'int.Viewer'],
            title: 'Welcome, providers.'
          }
        }
      },
      {
        url: '/reports/manage',
        config: {
          templateUrl: 'reports/manage/manage.html',
          controller: 'ReportsAdminCtrl',
          controllerAs: 'rptAdmin',
          // resolve: {
          //   navReady: ['NavMainSvc', function(NavMainSvc) {
          //     return NavMainSvc.getNavIsReady();
          //   }
          // ]},
          settings: {
            menu: {
              type: 'reports',
              num: 4,
              path: '#/reports/manage'
            },
            loginRequired: true,
            roles: ['int.ReportAdmin'],
            title: 'Reports publisher'
          }
        }
      }, {
        url: '/reports/faqs',
        config: {
          templateUrl: 'reports/faqs/faqs.html',
          controller: 'FaqCtrl',
          controllerAs: 'faq',
          settings: {
            menu: {
              type: 'reports',
              num: 5,
              path: '#/reports/faqs',
              title: 'About the reports'
            },
            loginRequired: true,
            roles: ['ext.ProvContact', 'int.Viewer', 'int.ReportAdmin'],
            title: 'About the reports'
          }
        }
      }]
    });
}());
