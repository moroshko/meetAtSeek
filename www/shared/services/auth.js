angular.module('shared').service('Auth', function(storage) {
  this.login = function(username) {
    storage.set('username', username);
  };

  this.username = function() {
    return storage.get('username');
  };
});
