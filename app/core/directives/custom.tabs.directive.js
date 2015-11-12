'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.module:customTabs
 * @description
 * # customTabs
 * Module of the riskShareApp
 */

(function() {

  angular.module('customTabs', []) //registered in riskshare.core.js

//pilfered in part from http://codereview.stackexchange.com/questions/46927/angularjs-tab-control
//also AngularJS Up & Running, Advanced Directives (tabs examples) http://shop.oreilly.com/product/0636920033486.do

  .directive('tabsContainer', ['$log', '$timeout', tabsContainerDirective])
  .directive('tabsTab', ['$log', tabsTabDirective]);

  function tabsContainerDirective($log, $timeout) {
    return {
      restrict: 'A',
      templateUrl: 'core/directives/templates/tabs_container.html',
      scope: {
        klass: '@class'
      },
      transclude: true,
      controller: ['$scope', '$element', '$attrs',
        function($scope, $element, $attrs) {
          $log.debug('THE SCOPE OF THE TAB CONTAINER DIRECTIVE');
          $log.debug($scope);

          var currentIndex = 0,
              currentTabSelected = 0;
          $scope.tabs = [];

          this.registerTab = function(scope) {
            if ($scope.tabs.length === 0) {
              scope.selected = true;
            } else {
              scope.selected = false;
            }
            $scope.tabs.push(scope);
          };

          $scope.selectTab = function(index) {
            currentIndex = index;
            for (var i = 0; i < $scope.tabs.length; i++) {
              $scope.tabs[i].selected = currentIndex === i;
            }
            $scope.$emit('tabSelected');
          };

          $scope.isSelectedTab = function(index) {
            return currentIndex === index;
          };
        }
      ]
    };
  }

  function tabsTabDirective($log) {
    return {
      restrict: 'A',
      templateUrl: 'core/directives/templates/tabs_tab.html',
      transclude: true,
      replace: true,
      scope: {
        name: '@name',
        selected: '=bind' //I am intending for this to be the value from the vm backing the tabs.
      },
      require: '^tabsContainer',
      link: function($scope, $element, $attrs, tabsCtrl) {
        $log.debug('THE SCOPE OF THE TABS TAB DIRECTIVE');
        $log.debug($scope);
        tabsCtrl.registerTab($scope);
      }
    };
  }

}());
