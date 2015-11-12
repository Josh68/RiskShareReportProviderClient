'use strict';

/**
 * @ngdoc function
 * @name riskShareApp.directive:typeAhead
 * @description
 * # typeAhead
 * Directive of the riskShareApp
 */

// A basic typeahead widget with some customizations
// Stolen and modified from http://www.sitepoint.com/creating-a-typeahead-widget-with-angularjs/

/* Attributes for markup and their functions:
  (any can be prefixed with 'data-')
  
  type-ahead: the main directive attribute
  model: the vm's model
  output: the model of the directive, which is generally a property on the vm's model (model.someProperty) - e.g., if a selection from the matched results is only supposed to set a property on the model and not an entire object
  items: the array of items (strings or objects) to filter on
  no-select: the results are not a selectable list
  input-id: the id of the input
  input-name: the name attribute of the input (for angular validations)
  prompt: the placeholder
  min-chars: the minimum number of characters for a match
  title: the main match string on the items in the results
  subtitle: the secondary match string on the items in the results
  suppress-subtitle: don't show the subtitle in the results, even if there is one
  ignore-case: match in a case-insensitive way
  set-disabled: disable the control
  ng-model-options: sets options for event binding updates, eg, on blur rather than keyup or mouseup; use as an {updateOn: 'event'} object
  is-required: set the required attribute on the input
  on-blur: a function to be triggered on the controller of the directive on blur - no handling

*/

(function() {

  angular.module('riskShareApp')
    .directive('typeAhead', ['$log', '$q', '$timeout', '$parse', '$filter', 'debounce', typeAheadDirective])
    .directive('ngBindAttrs', ['$parse', '$timeout', '$compile', ngBindAttrsDirective]);

  //because this is required by the tempalte and I don't have time to rework this whole thing as its own module that contains the dependencies, I'm defining the typeAhead and ngBindAttrs directives together. Should I need this elsewhere, I'd have to duplicate the functionality there.

  //ngBindAttrs is being used by the typeAhead's template, not out in the app controllers
  //it binds the name attribute for use by the input in the typeAhead's template, so that form validations are set up correctly
  function ngBindAttrsDirective($parse, $timeout, $compile) {
    return {
      restrict: 'A',
      terminal: true,
      priority: 1000,
      controller: ['$scope', '$element', '$attrs', ngBindAttrsDirectiveCtrl],
      compile: compileFn
    };
    function ngBindAttrsDirectiveCtrl($scope, $element, $attrs) {
      var attrsObj = $scope.$eval($attrs.ngBindAttrs);
      angular.forEach(attrsObj, function(value, key) {
        if (!angular.isUndefined(value)) {
          $attrs.$set(key, value);
        }
      });
    }
    function compileFn(tElem, tAttrs) {
      tElem.removeAttr('ng-bind-attrs');
      tElem.removeAttr('data-ng-bind-attrs');
      return {
        pre: function preLink(scope, iElem, iAttrs, controller) {},
        post: function postLink(scope, iElem, iAttrs, controller) {
          $compile(iElem)(scope);
        }
      };
    }
  }

  function typeAheadDirective($log, $q, $timeout, $parse, $filter, debounce) {
    return {
      restrict: 'AEC',
      scope: {
        items: '=',
        prompt: '@',
        title: '@',
        subtitle: '@',
        inputId: '@',
        inputName: '@',
        model: '=',
        output: '=',
        value: '=',
        onSelect: '&',
        onTypeAhead: '&',
        minChars: '@',
        isRequired: '@',
        setDisabled: '=?',
        modelOptions: '@',
        maxLength: '@',
        minLength: '@',
        showInvalid: '=?',
        onBlur: '&'
      },
      templateUrl: 'core/directives/templates/type_ahead.html',
      link: function($scope, $element, $attrs, ngModelCtrl) {
        var noSelect = $attrs.hasOwnProperty('noSelect'), //check for the no-select attribute
          isRequired = $attrs.hasOwnProperty('isRequired'), //check for required
          updateOnBlur = (function(){
            if ($attrs.hasOwnProperty('modelOptions')) {
              $log.debug($scope.$eval($attrs.modelOptions));
              var modelOptions = $scope.$eval($attrs.modelOptions);
              if (modelOptions.hasOwnProperty('updateOn')) {
                if (angular.isString(modelOptions.updateOn)) {
                  if (modelOptions.updateOn.indexOf('blur') > -1) {
                    return true;
                  }
                }
              }
            }
            return false;
          }()),
          typeAheadInput = angular.element($element[0].querySelector('.type-ahead-input')),
          typeAheadList = angular.element($element[0].querySelector('.type-ahead-list')),
          filterFilter = $filter('filter'),
          title = $scope.title,
          subtitle = $scope.subtitle,
          suppressSubtitle = !angular.isUndefined($attrs.suppressSubtitle) ? true : false,
          ignoreCase = !angular.isUndefined($attrs.ignoreCase) ? true : false,
          unbindScopeWatch = function() {}, //placeholder for scope watch
          lastSelectedItem = lastSelectedItem || {},
          outputAttrSubstr = $attrs.output.substr($attrs.output.lastIndexOf('.') + 1), //name of the vm's output property
          modelAttrSubstr = $attrs.model.substr($attrs.model.lastIndexOf('.') + 1), //name of the vm's model property
          outputAttrIsModelAttr = outputAttrSubstr === modelAttrSubstr, //eg, model attr is thing.selected.id and output attr is the same
          outputAttrSubstrNotTitleOrSubtitle = outputAttrSubstr !== title && outputAttrSubstr !== subtitle;

        $log.debug('the value of isRequired');
        $log.debug($scope.isRequired);

        //resets
        $scope.typeAhead = {
          requiredChars: false, //start with the assumption that there aren't enough chars for results
          current: 0,
          valid: true,
          selected: true, // hides the list initially
          suppressSubtitle: suppressSubtitle
        };

        $scope.filteredItems = []; //placeholder for the array of matches
        $scope.requiredLengthFilteredItems = []; //placeholder for the array of matches that meet min length requirements

        // if (angular.isUndefined($scope.isRequired)) {
        //   typeAheadInput.removeAttr('required');
        // }
        // if (!angular.isUndefined($scope.isRequired)) {
        //   typeAheadInput.attr('required', 'required');
        // }

        //if minChars is missing, just set it to one
        if (!$scope.minChars) {
          $scope.minChars = 1;
        }

        //if the element has the no-select attribute, remove the class needed for enabling selectable styling
        if (noSelect) {
          typeAheadList.removeClass('type-ahead-selectable');
        }

        $scope.$watchCollection(function(){
          if ($scope.typeAhead.requiredChars) {
            return $scope.requiredLengthFilteredItems;
          }
        }, function(newVal, oldVal){
          if (!angular.isUndefined(newVal)) {
            if (newVal.length > 0) {
              typeAheadInput.addClass('matched');
              typeAheadList.addClass('matched');
              typeAheadList.children().addClass('matched');
              typeAheadList.children().children().addClass('matched');
            } else {
              typeAheadInput.removeClass('matched');
              typeAheadList.removeClass('matched');
              typeAheadList.children().removeClass('matched');
              typeAheadList.children().children().removeClass('matched');
            }
          }
        });

        $scope.$watch(function(){
          return $scope.setDisabled;
        }, function(newVal, oldVal){
          $log.debug('setDisabled new value: ' + newVal);
          if (newVal) {
            typeAheadInput.attr('disabled', 'disabled');
          }
          if (!newVal) {
            typeAheadInput.removeAttr('disabled');
          }
        });      

        //this is called on ng-click from an item the list of results - sets it to the value in the input and triggers a bound method on the controller, if needed
        $scope.handleSelection = function(selectedItem) {
          $log.debug('SELECTED ITEM');
          $log.debug(selectedItem);
          if (!noSelect) { //don't do anything if the no-select attribute is set (this is the option to just see results, but not be able to select from them)
            // it should always be that the passed model is an object (probably an array of 1 or more values or objects), but this conditional checks and has a fallback for a string model and string selected item
            if (angular.isObject(selectedItem)) {
              $log.debug('from HANDLESELECTION inside the typeahead directive ($scope.output, $element, $attrs, $scope.model, and selectedItem)');
              $log.debug($scope.output); //what was entered in the input, not what is in the input when the selection is made
              //$log.debug($element);
              $log.debug($attrs);
              $log.debug($scope.model);
              $log.debug(selectedItem);
              //TODO - this complex logic needs to be tested (preferably unit tested) to see if it works with different types of typeahead models and output objects (or strings)
              angular.forEach(selectedItem, function(value, key) {
                var isOutputAttrSubstr = outputAttrSubstr.indexOf(key) > -1, //TODO - determine whether a custom value is used on "output" and condition the population of the entire object (rather than a single property) on that flag - IE, if it is a custom output attribute value, populate the entire object on select, otherwise, just a single property string
                    isScopeModelProperty = $scope.model.hasOwnProperty(key); //the model defined on the typeahead and the selected item's model must compare each property to know whether to update it
                //$log.debug(key);
                //$log.debug(modelKey);
                //$log.debug(isModelProperty);
                $log.debug('debugging inside foreach selecteditem in handleselection of typeahead directive');
                $log.debug(!angular.isUndefined($scope.model[key]));
                $log.debug(isScopeModelProperty);
                if (angular.isObject($scope.model)) {
                  if (isScopeModelProperty) {
                    $scope.model[key] = value;
                  }
                }
                if (angular.isString($scope.model)) {
                  if (outputAttrSubstr === key) {
                    $scope.model = value;
                  }
                }
                //if (!outputNotTitleOrSubtitle) { //if the output property is the same as either the title or subtitle
                  
                //} else {
                  //what to do if the output (input model) isn't the same as the title or subtitle, like a computed?
                //}
              });
            } else if (angular.isString(selectedItem) && angular.isString($scope.model)) {
              $scope.model = selectedItem;
            }
            lastSelectedItem = angular.copy($scope.model);
            //reset to initial state after a selection is made
            $scope.typeAhead.current = 0;
            $scope.typeAhead.selected = true;
            //now the watch on the model object will trigger the onSelect method on the controller
          }
        };

        // watch for model changes made in handleSelection and trigger the onSelect method on the controller

        
        unbindScopeWatch = $scope.$watchCollection(function() {
          if ($scope.typeAhead.requiredChars && !isEmpty(lastSelectedItem)) {
            //return $scope.model;
            return lastSelectedItem;
          }
        }, function(newVal, oldVal) {
          if (!angular.isUndefined(newVal)) {
            $scope.onSelect();
            lastSelectedItem = {};
          }
        });
        
        //bind to keyup in the type-ahead input
        typeAheadInput.on('keyup', function(event) {
          debounce(200, typeAheadCallback(event));
        });

        //the bound function
        function typeAheadCallback(event) {

          var onTypeAheadPromise = null,
              tempFilteredArray = [],
              newItemsArray = [],
              typeAheadScopeExpression = $attrs.onTypeAhead,
              typeAheadInvoker = $parse(typeAheadScopeExpression);

          if(!angular.isUndefined($scope.output)) {

            if ($scope.output.length >= $scope.minChars) {

              var outputLC = $scope.output.toLowerCase(),
                  ignoreCaseParam = ignoreCase ? false: undefined; //false is the value to ignore case, so negate the variable value set by the attribute from the view

              $scope.typeAhead.requiredChars = true;

              onTypeAheadPromise = $q.when($scope.onTypeAhead({$event: event}));
              
              onTypeAheadPromise.then(function(response){
                //$log.debug(response);
                if (response) {
                  $scope.items = response;
                }

                $scope.filteredItems = filterFilter($scope.items, $scope.output, ignoreCaseParam); //the entity list filtered by input, using either a case-sensitive comparison (ignoreCaseParam is undefined), or case-insensitive (false)

                //$log.debug('matching properties only for typeahead');
                //$log.debug($scope.title);
                //$log.debug($scope.subtitle);

                tempFilteredArray = angular.copy(filterFilter($scope.items, $scope.output, ignoreCaseParam));
                //tempFilteredArray = angular.copy($scope.items);

                //now filter out unintended matches, like an id matching a partial tin (this could probably substitute for the first filter altogether, but for some reason (BUG?) I'm missing results if I don't implement the first filter)
                angular.forEach(tempFilteredArray, function(item, key){
                  if (item.hasOwnProperty(title) || item.hasOwnProperty(subtitle)) {
                    var itemTitle = item[title],
                        itemSubtitle = item[subtitle],
                        scopeOutput = $scope.output;

                    if (!angular.isString(itemTitle)) {
                      itemTitle = '';
                    }
                    if (!angular.isString(itemSubtitle) || suppressSubtitle) {
                      itemSubtitle = '';
                    }

                    if (ignoreCase) {
                      itemTitle = angular.isFunction(itemTitle.toLowerCase) ? itemTitle.toLowerCase() : itemTitle;
                      itemSubtitle = angular.isFunction(itemSubtitle.toLowerCase) ? itemSubtitle.toLowerCase() : itemSubtitle;
                      scopeOutput = angular.isFunction($scope.output.toLowerCase) ? $scope.output.toLowerCase() : $scope.output;
                    }
                    
                    if (itemTitle.indexOf(scopeOutput) !== -1 || itemSubtitle.indexOf(scopeOutput) !== -1) {
                      newItemsArray.push(item);
                    }
                  }
                });

                $scope.requiredLengthFilteredItems = newItemsArray;

                if ($scope.requiredLengthFilteredItems.length === 0) {
                  typeAheadList.addClass('empty');
                } else {
                  typeAheadList.removeClass('empty');
                }

              });

            } else {
              $scope.typeAhead.requiredChars = false;
              typeAheadList.addClass('empty');
              $scope.$apply();
            }
          }
          
        }

        //show the results when using the input again
        typeAheadInput.on('keydown', typeAheadKeyDownCallback);

        //use the updateOnBlur value from ngModelOptions add-in
        //if this is being used and is set to handle invalid state on blur, set a scope property to true or false for showing invalid states only when not focued on the input
        if (updateOnBlur) {
          updateOnBlurHandler();
        }

        //need to check input's validity states before doing anything ?? or is this just a fool's errand?
        function updateOnBlurHandler() {
          typeAheadInput.on('focus', function(event) {
            // var thisEl = angular.element(this);
            // $log.debug(event);
            // $log.debug(thisEl);
            $scope.$apply(function() {
              $scope.showRequired = false;
            });
          });
          typeAheadInput.on('blur', function(event) {
            //var thisEl = angular.element(this);
            // $log.debug(event);
            // $log.debug(thisEl);
            $scope.$apply(function() {
              $scope.showRequired = true;
            });
          });
        }

        //the show results callback
        function typeAheadKeyDownCallback() {
          $scope.typeAhead.selected = false; //we're actively searching again, so show results again, if there are some and other rules pass (like min chars)
        }

        //bind to document mousedown to hide the results if clicking outside the typeahead input or results
        angular.element(document).on('mousedown', documentMouseDownCallback);

        //the click outside callback
        function documentMouseDownCallback(event) { //TODO - test across browsers
          if (!angular.isUndefined(event)) {
            if (!angular.isUndefined(event.target)) {
              var eventTarget = angular.element(event.target),
                  eventTargetClasses = eventTarget.attr('class');
              if (typeof eventTargetClasses === 'string') { //jQuery attr returns a space-delineated string of classnames
                var isTypeAhead = eventTargetClasses.indexOf('type-ahead') > -1 && eventTargetClasses.indexOf('matched') > -1;
                // $log.debug(eventTarget);
                // $log.debug(eventTarget.attr('class'));
                if (!isTypeAhead) {
                  $scope.typeAhead.selected = true; //when the user clicks outside
                  $scope.$digest();
                }
              }
            }
          }
        }

        //for highlighting the currently hovered item with an active class in the results (setter and getter)
        $scope.isCurrent = function(index) {
          return $scope.typeAhead.current === index;
        };
        $scope.setCurrent = function(index) {
          $scope.typeAhead.current = index;
        };

        function isEmpty(obj) {
          for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
              return false;
            }
          }
          return true;
        }

        function cleanupDestroyedDirective() {
          typeAheadInput.off();
          typeAheadList.off();
          unbindScopeWatch();
        }

        $scope.$on('$destroy', function() {
          $log.debug('destroying typeahead directive');
          cleanupDestroyedDirective();
        });

      }
    };
  }

}());
