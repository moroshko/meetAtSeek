angular.module('tab1', []).controller('Tab1Ctrl', function($scope, Interests) {
  $scope.data = {
    filter: ''
  };

  $scope.addInterest = function() {
    Interests.add($scope.data.filter).then(function() {
      $scope.data.filter = '';
    });
  };
});
