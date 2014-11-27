angular.module('shared').service('Auth', function(storage) {
  this.reset = function() {
    storage.set('username', null);
  };

  this.login = function(username) {
    storage.set('username', username);
  };

  this.username = function() {
    return storage.get('username');
  };

  this.requestsCount = 0;

  this.setRequestsCount = function(count) {
    console.log('set');
    this.requestsCount = count;
  };
});
