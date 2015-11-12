'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.service:Menu
 * @description
 * # Menu
 * Service of the riskShareApp
 */



(function() {

  angular
    .module('services.core.Menu', [])
    .provider('MenuSvc', MenuSvc);

  function MenuSvc() {

    var menuItems = menuItems || [],
      storeHasMenuItems = false;

    return {
      addMenuItems: addMenuItems,
      noMenuItemsInStorage: noMenuItemsInStorage,
      $get: ['$log', '$q', '$window', 'MENU_STORE_PREFIX', getMenuItemsFn]
    };

    function addMenuItems(passedInMenuItems) {
      //console.log('PASSEDINMENUITEMS::');
      //console.log(passedInMenuItems);
      passedInMenuItems.forEach(function(item) {
        //console.log('PASSEDINMENUITEM::');
        //console.log(item);
        menuItems.push(item);
      });

      menuItems.sort(compareMenuNames);

      function compareMenuNames(itemOne, itemTwo) {
        if (!angular.isUndefined(itemOne.num) && !angular.isUndefined(itemOne.num)) {
          if (itemOne.num < itemTwo.num) {
            return -1;
          }
          if (itemOne.num > itemTwo.num) {
            return 1;
          }
          return 0;
        }
      }
    }

    function noMenuItemsInStorage() {
      return !storeHasMenuItems;
    }

    function getMenuItemsFn($log, $q, $window, MENU_STORE_PREFIX) {
      var store = $window.localStorage;

      return {
        getMenuItems: function() { //the function returned from the provider's get (the wrapped function)
          var deferred = $q.defer(), //make chainable with a deferred, return the value of menuitems in the resolve
            storeNeedsNoUpdating = (function() {
              var returnVal = true;
              menuItems.forEach(function(value, key) {
                var storedMenuItem = angular.fromJson(store.getItem(MENU_STORE_PREFIX + key));
                $log.debug('storedMenuItem:: ');
                $log.debug(storedMenuItem);
                $log.debug('menuItem value:: ');
                $log.debug(value);
                if (!angular.equals(storedMenuItem, value)) {
                  returnVal = false;
                }
              });
              return returnVal;
            }());

          if (storeNeedsNoUpdating) {
            var menuItemsFromStore = getMenuItemsFromStore(store);
            storeHasMenuItems = true; //this should indicate that all menu items previously defined by the config service are now in localStorage and can be gotten from there
            // $log.debug(menuItemsFromStore);
            deferred.resolve(menuItemsFromStore);
          } else {
            // $log.debug('retrieved menu items: ');
            // $log.debug(menuItems);
            menuItems.forEach(function(value, key) {
              $log.debug(value);
              store.setItem(MENU_STORE_PREFIX + key, angular.toJson(value));
            });
            $log.debug('storeNeedsNoUpdating: ' + storeNeedsNoUpdating);
            deferred.resolve(menuItems); //if we can't get menuitems from localStorage, we return the built-up array from here
          }

          return deferred.promise;
        }
      };
    }

    function getMenuItemsFromStore(store) {
      var menuItemsFromStore = [];
      for (var storeItem in store) {
        if (storeItem.indexOf('rsMenu') > -1) {
          var storedMenuItem = angular.fromJson(store[storeItem]);
          // $log.debug('storeitems');
          // $log.debug(storeItem);
          // $log.debug(storedMenuItem);
          menuItemsFromStore.push(storedMenuItem);
        }
      }
      return menuItemsFromStore;
    }

  }

}());
