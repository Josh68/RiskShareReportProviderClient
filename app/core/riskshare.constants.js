'use strict';

/**
 * @ngdoc overview
 * @name riskShareAppConstants
 * @description
 * # angularAppApp (original)
 *
 * Constants of the RiskShare application.
 */

(function() {

  angular.module('riskShareAppCore')
    .constant({
      'REMOTE_API_URL': 'https://www.stg2.modahealth.com/RiskShareReportProviderWS/rest', //TODO - refactor to vary per environment once we're in dev and prod
      'LOCAL_API_URL': 'http://localhost:9080/RiskShareReportProviderWS/rest',
      'JOSH_URL': 'http://5zczhq1.pdx.odshp.com:9080/RiskShareReportProviderWS/rest',
      'NAVEEN_URL': 'http://BKQ3VR1.pdx.odshp.com:9081/RiskShareReportProviderWS/rest',
      'VICTOR_URL': 'http://5YSYHQ1.pdx.odshp.com:9080/RiskShareReportProviderWS/rest',
      'DEPLOY_URL': (function() { //figure out where the client is and either return the current fqdn and pathname or default to STG2 or ST2
        var protocolHost = ((location.host.indexOf('odshp') > -1 || location.host.indexOf('modahealth') > -1 || location.port.indexOf('908') > -1) && location.port !== '9000') ? location.protocol + '//' + location.host : location.protocol + '//wasapp1stg2.odshp.com';
        //console.log('The API_URL should be: ' + location.host);
        return protocolHost + '/RiskShareReportProviderWS/rest';
      }()),
      'API_URL': (function() { //figure out where the client is and either return the current fqdn and pathname or default to STG2 or ST2
        var protocolHost = ((location.host.indexOf('odshp') > -1 || location.host.indexOf('modahealth') > -1 || location.port.indexOf('908') > -1) && location.port !== '9000') ? location.protocol + '//' + location.host : location.protocol + '//wasapp1stg2.odshp.com';
        //console.log('The API_URL should be: ' + location.host);
        return protocolHost + '/RiskShareReportProviderWS/rest';
      }()),
      'DOC_URL': (function() {
        var lowerCaseHost = location.host.toLowerCase(),
          protocolString = location.protocol + '//',
          hostType = lowerCaseHost.indexOf('stg.') > -1 && lowerCaseHost.indexOf('stg2.') === -1 ? 'stgHost' :
            lowerCaseHost.indexOf('stg2.') > -1 ? 'stg2Host' :
            lowerCaseHost.indexOf('st.') > -1 && lowerCaseHost.indexOf('stg.') === -1 && lowerCaseHost.indexOf('stg2.') === -1 && lowerCaseHost.indexOf('st2') === -1 && lowerCaseHost.indexOf('localhost') === -1 ? 'stHost' :
            lowerCaseHost.indexOf('st2.') > -1 ? 'st2Host' :
            lowerCaseHost.indexOf('mo.') > -1 && lowerCaseHost.indexOf('mo2.') === -1 ? 'moHost' :
            lowerCaseHost.indexOf('mo2.') > -1 ? 'mo2Host' : 
            location.port === '9000' && lowerCaseHost.indexOf('modahealth') === -1 ? 'devHost' : 'prodHost';
        //console.log('hosttype is ' + hostType);
        switch (hostType) {
          case 'devHost':
            return protocolString + 'www.stg2.modahealth.com';
          case 'stgHost':
            return protocolString + 'www.stg.modahealth.com';
          case 'stg2Host':
            return protocolString + 'www.stg2.modahealth.com';
          case 'stHost':
            return protocolString + 'www.st2.modahealth.com';
          case 'st2Host':
            return protocolString + 'www.st2.modahealth.com';
          case 'moHost':
            return protocolString + 'www.mo.modahealth.com';
          case 'mo2Host':
            return protocolString + 'www.mo2.modahealth.com';
          case 'prodHost':
            return protocolString + 'www.modahealth.com';
          default:
            return protocolString + 'www.modahealth.com';
        }
      }()),
      'TYPEAHEAD_MIN_CHARS': '3',
      'APP_STORE_PREFIX': 'rs', //!!! must be a substring of the other STORE_PREFIXES (or PREFII) !!!
      'USER_STORE_PREFIX': 'rsUser.', //!!! APP_STORE_PREFIX must be a substring of this !!!
      'MENU_STORE_PREFIX': 'rsMenu.',//!!! APP_STORE_PREFIX must be a substring of this !!!
      'CONTENT_STORE_PREFIX': 'rsContent.',//!!! APP_STORE_PREFIX must be a substring of this !!!
      'API_PATHS': { //keep filling this out
        testLogin: '/login',
        content: '/content',
        login: '/user/authentication',
        logout: '/user/logout',
        reports: '/reports/',
        reportTypes: '/reports/types',
        reportsUpdate: '/reports/update',
        reportCodes: '/reports/codes',
        publish: '/reports/publish',
        retract: '/reports/retract',
        reject: '/reports/reject',
        pres: '/entities/pres',
        createPre: '/entities/pres/create',
        updatePre: '/entities/pres/update',
        tins: '/entities/tins',
        createTin: '/entities/tins/create',
        updateTin: '/entities/tins/update',
        hs: '/entities/hs',
        createHs: '/entities/hs/create',
        updateHs: '/entities/hs/update',
        password: '/account/change/password',
        setQuestion: '/account/create/security',
        verify: '/account/verify',
        verifySecurity: '/account/verify/security',
        forgotUsername: '/account/verify/user',
        forgotPassword: '/account/verify/username',
        resetPassword: '/account/reset/password',
        selfRegistration: '/account/create',
        selfRegistrationCreate: '/account/create/user',
        reauth: '/reauth',
        healthCheck: '/ping',
        boeHealthCheck: '/pingDownload'
      },
      'CONTENT': {
        modaDateFormat: 'MM/DD/YYYY',
        originalDateFormat: 'YYYY-MM-DD',
        returnToSearch: 'Back to search results',
        reports: {
          view: {
            presPlaceholder: 'Select',
            reportsPlaceholder: {
              name: 'All available reports',
              code: 'UTIL_ALL' //the logic here is that clinical is always first, and the name is just a placeholder - this will be reset depending on the PRE chosen
            },
            reportsHeaders: {
              financial: {
                name: '--All FINANCIAL Reports--',
                code: 'FIN_ALL'
              },
              clinical: {
                name: '--All CLINICAL Reports--',
                code: 'UTIL_ALL'
              }
            }
          },
          manage: {

          }
        },
        messages: {

        },
        menus: {
          navUtil: {
            modaHome: {
              title: 'Moda providers home',
              path: 'https://www.modahealth.com/medical'
            },
            contact: {
              title: 'Contact us',
              path: 'https://www.modahealth.com/medical/contactus.shtml'
            }
          },
          navLoggedIn: {
            password: {
              title: 'Change your password',
              path: '#/password'
            },
            logout: {
              title: 'Log out',
              path: '#/login'
            }
          }
        },
        application: {
          name: 'Provider Reports'
        },
        userMgmt: {
          passwordFormId: 'password-form',
          verifyPasswordFormId: 'verify-password-form',
          resetPasswordFormId: 'reset-password-form',
          securityFormId: 'security-form',
          verifySecurityFormId: 'verify-security-form',
          verifyUserFormId: 'verify-user-form',
          createUserFormId: 'create-user-form',
          forgotUsernameFormId: 'forgot-username-form'
        }
      },
      'ROLE_CLASSES': {
        ext: {
          ProvContact: 'provider-contact'
        },
        int: { //jshint ignore:line
          ReportAdmin: 'reports-admin',
          PreAdmin: 'entity-admin',
          Viewer: 'internal-viewer'
        }
      },
      TIPSOCONFIG: {
        background: '#e3f2f0',
        maxWidth: '200px'
      },
      'CORE_ROUTE_CONFIGS': [{ //feature configs are in their respective features, eg reports/reports.constants.js
        url: '/login',
        config: {
          templateUrl: 'core/views/login/login.html',
          controller: 'LoginCtrl',
          controllerAs: 'login',
          resolve: { //login route calls a async function that just destroys our "session" from the get-go.
            loggedInFlag: ['AuthenticationSvc',
              function(AuthenticationSvc) { //TODO: This may be temporary. Need to evaluate with real auth and token
                return AuthenticationSvc.clearAll(); //this should return false to the value of loggedInFlag. LoginCtrl will set $rootScope.isLoggedIn to this value. We do this because it checks localStorage to be sure it's cleared out.
              }
            ]
          },
          title: 'Welcome to Provider Reports',
          settings: {
            loginRequired: false,
            roles: [],
            title: 'Log in'
          }
        }
      },
      {
      url: '/forgotUsername',
      config: {
        templateUrl: 'core/views/forgotUsername/forgotUsername.html',
        controller: 'ForgotUsernameCtrl',
        controllerAs: 'forgotUsername',
        title: 'Forgot username',
        settings: {
          loginRequired: false,
          roles: [],
          title: 'Forgot your username',
          securityTitle: 'Forgot your username'
          }
      	}
      }, {
          url: '/forgotPassword',
          config: {
            templateUrl: 'core/views/forgotPassword/forgotPassword.html',
            controller: 'ForgotPasswordCtrl',
            controllerAs: 'forgotPassword',
            title: 'Forgot password',
            settings: {
              loginRequired: false,
              roles: [],
              title: 'Forgot your password',
              securityTitle: 'Forgot your password'
            	}
          }
      },  {
          url: '/verifySecurity/forgotenUsername',
          config: {
            templateUrl: 'core/views/verifySecurity/verifySecurity.html',
            controller: 'VerifySecurityCtrl',
            controllerAs: 'verifySecurity',
            title: 'Verify Security',
            resolve: {
                ctrlOptions: function() {
                  return {
                    isForgotUsername: true
                  };
                }
              },
            settings: {
              loginRequired: false,
              roles: [],
              title: 'Forgot your username',
              securityTitle: 'Forgot your username'
            	}
          }
       }, {
	   url: '/verifySecurity/forgotenPassword',
	   config: {
	   templateUrl: 'core/views/verifySecurity/verifySecurity.html',
	   controller: 'VerifySecurityCtrl',
	   controllerAs: 'verifySecurity',
	   title: 'Verify Security',
	   resolve: {
	   ctrlOptions: function() {
	      return {
	          isForgotPassword: true
	      };
	     }
	    },
	    settings: {
	       loginRequired: false,
	   	roles: [],
	   	title: 'Forgot your password',
	   	securityTitle: 'Forgot your password'
	    }
	   }
       }, {
	   url: '/account/create',
	   config: {
	   templateUrl: 'core/views/selfRegistration/selfRegistration.html',
	   controller: 'SelfRegistrationCtrl',
	   controllerAs: 'selfRegistration',
	   title: 'Create user.',
	   resolve: {
	   ctrlOptions: function() {
	      return {
	          stepOne: true
	      };
	     }
	    },
	    settings: {
	       loginRequired: false,
	   	roles: [],
	   	title: 'Self service; create account.',
	   	securityTitle: 'Create account.'
	    }
	   }
    }, {
        url: '/password',
        config: {
          templateUrl: 'core/views/password/password.html',
          controller: 'PasswordCtrl',
          controllerAs: 'password',
          resolve: {
            usernameIsSet: ['UserSvc',
              function(UserSvc) {
                return UserSvc.checkUserIdIsSet();
              }
            ]
            // ,
            // navReady: ['NavMainSvc',
            //   function(NavMainSvc) {
            //     return NavMainSvc.getNavIsReady(); //this may be brittle, but calls the service that handles all the nested calls from the controller that set up the nav. If all values have been set, this resolves to true. No handler for if it doesn't resolve.
            //   }
            // ]
          },
          title: 'Change your password',
          settings: {
            loginRequired: true,
            roles: [],
            title: 'Change your password',
            securityTitle: 'Change your password'
          }
        }
      }, {
        url: '/security',
        config: {
          templateUrl: 'core/views/security/security.html',
          controller: 'SecurityCtrl',
          controllerAs: 'security',
          resolve: {
            usernameIsSet: ['UserSvc',
              function(UserSvc) {
                return UserSvc.checkUserIdIsSet();
              }
            ]
            //,
            // navReady: ['NavMainSvc',
            //   function(NavMainSvc) {
            //     return NavMainSvc.getNavIsReady(); //this may be brittle, but calls the service that handles all the nested calls from the controller that set up the nav. If all values have been set, this resolves to true. No handler for if it doesn't resolve.
            //   }
            // ]
          },
          title: 'Enter a security question',
          settings: {
            loginRequired: true,
            roles: [],
            title: 'Enter a security question',
            securityTitle: 'Enter a security question'
          }
        }
      }, {
        url: '/error',
        config: {
          templateUrl: 'core/views/error/error.html',
          controller: 'ErrorCtrl',
          controllerAs: 'error',
          title: 'Oops!',
          settings: {
            loginRequired: true,
            roles: [],
            title: 'Error'
          }
        }
      },
      {
        url: '/home',
        config: {
          templateUrl: 'core/views/home/home.html',
          controller: 'HomeCtrl',
          controllerAs: 'home',
          resolve: {
            usernameIsSet: ['UserSvc',
              function(UserSvc) {
                return UserSvc.checkUserIdIsSet();
              }
            ]
            // ,
            // navReady: ['NavMainSvc',
            //   function(NavMainSvc) {
            //     return NavMainSvc.getNavIsReady(); //this may be brittle, but calls the service that handles all the nested calls from the controller that set up the nav. If all values have been set, this resolves to true. No handler for if it doesn't resolve.
            //   }
            // ]
          },
          settings: {
            // menu: {
            //   type: 'main',
            //   num: 1,
            //   path: '#/home',
            //   title: 'Select a role'
            // },
            loginRequired: true,
            roles: ['int.PreAdmin', 'int.ReportAdmin'],
            title: 'Select a role' //"title" means page title and may be used for navTitle if none is specified
          }
        }
      },
      {
        url: '/notfound',
        config: {
          templateUrl: 'core/views/notfound/notfound.html',
          controller: 'NotFoundCtrl',
          controllerAs: 'notfound',
          title: 'Not Found',
          settings: {
            loginRequired: false,
            roles: [],
            title: 'Oops!'
          }
        }
      }, {
        url: '/',
        config: {
          redirectTo: '/login', //TODO - probably want to see if the user has logged out and otherwise redirect to a home or keep on same view
          settings: {
            loginRequired: false,
            roles: []
          }
        }
      }],
      //add moment.js as a constant
      moment: 'moment'
    });
}());
