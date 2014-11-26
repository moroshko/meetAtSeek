angular.module('shared').service('PleaseWait', function($ionicLoading) {
  this.show = function(text) {
    $ionicLoading.show({
      template: text || 'Please wait...'
    });
  };

  this.hide = function() {
    $ionicLoading.hide();
  };
});
