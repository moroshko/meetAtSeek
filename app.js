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

.run(function($ionicPlatform, $timeout, FIREBASE_ROOT, $rootScope, Auth) {
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

    $rootScope.Auth = Auth;

    var usersRef = new Firebase(FIREBASE_ROOT + '/users');

    $timeout(function() {
      $rootScope.$watch(function() {
        return Auth.username();
      }, function(newValue) {
        if (newValue === null) {
          return;
        }

        usersRef.child(Auth.username()).child('requests').on('value', function(snapshot) {
          Auth.setRequestsCount(snapshot.val() === null ? 0 : Object.keys(snapshot.val()).length);
        });
      });
    }, 500);
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
    .state('tab.tab3-all', {
      url: '/tab3/all/:view/:username',
      views: {
        'tab3': {
          templateUrl: 'tab3/tab3.html',
          controller: 'Tab3Ctrl'
        }
      }
    })
    .state('tab.tab3-new', {
      url: '/tab3/new/:view/:username',
      views: {
        'tab3': {
          templateUrl: 'tab3/tab3.html',
          controller: 'Tab3Ctrl'
        }
      }
    })
    .state('tab.tab3-view', {
      url: '/tab3/view/:view/:username',
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
.constant('FIREBASE_ROOT', 'https://seekhack3.firebaseio.com');

// Development
//.constant('FIREBASE_ROOT', 'https://test-seekhack3.firebaseio.com');

