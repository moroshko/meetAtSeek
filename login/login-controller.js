angular.module('login', ['shared']).controller('LoginCtrl', function($scope, $state, PleaseWait, Auth, Users) {
  $scope.user = {
    username: '',
    password: '',
    showPassword: false
  };

  function onLogin() {
    Auth.login($scope.user.username);
    PleaseWait.hide();
    $state.go('tab.tab1');
  }

  $scope.login = function() {
    PleaseWait.show();

    $scope.user.username = $scope.user.username.toLowerCase();

    Users.exists($scope.user.username).then(function(exists) {
      if (exists) {
        onLogin();
      } else {
        Users.add($scope.user.username).then(onLogin);
      }
    });
  };
});
