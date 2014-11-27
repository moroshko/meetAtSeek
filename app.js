angular.module('starter', [
  'ionic',
  'firebase',
  'angularLocalStorage',
  'shared',
  'login',
  'tab1',
  'tab2',
  'tab3'
])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: 'login/login.html',
      controller: 'LoginCtrl'
    })
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "tabs.html"
    })
    .state('tab.tab1', {
      url: '/tab1',
      views: {
        'tab1': {
          templateUrl: 'tab1/tab1.html',
          controller: 'Tab1Ctrl'
        }
      }
    })
    .state('tab.tab2', {
      url: '/tab2',
      views: {
        'tab2': {
          templateUrl: 'tab2/tab2.html',
          controller: 'Tab2Ctrl'
        }
      }
    })
    .state('tab.tab3', {
      url: '/tab3/:view/:username',
      views: {
        'tab3': {
          templateUrl: 'tab3/tab3.html',
          controller: 'Tab3Ctrl'
        }
      }
    });

  $urlRouterProvider.otherwise('/login');

})

// Production
//.constant('FIREBASE_ROOT', 'https://seekhack3.firebaseio.com');

// Development
.constant('FIREBASE_ROOT', 'https://test-seekhack3.firebaseio.com');

