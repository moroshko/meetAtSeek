angular.module('shared').service('Interests', function($q, FIREBASE_ROOT, Auth, Users) {
  var interestsRef = new Firebase(FIREBASE_ROOT + '/interests');
  var self = this;

  this.all = function() {
    var defer = $q.defer();

    interestsRef.once('value', function(snapshot) {
      var interests = snapshot.val();

      if (interests === null) {
        defer.resolve([]);
      } else {
        var result = [];

        snapshot.forEach(function(interestSnapshot) {
          var interest = interestSnapshot.val();

          if (interest !== null) {
            interest.id = interestSnapshot.key();
          }

          result.push(interest);
        });

        defer.resolve(result);
      }
    });

    return defer.promise;
  };

  this.getById = function(interestId) {
    var defer = $q.defer();

    interestsRef.child(interestId).once('value', function(snapshot) {
      var interest = snapshot.val();
      
      if (interest !== null) {
        interest.id = snapshot.key();
      }

      defer.resolve(interest);
    });

    return defer.promise;
  };

  this.getIdByName = function(interest) {
    var defer = $q.defer();
    var interestId = null;

    interestsRef.once('value', function(snapshot) {
      snapshot.forEach(function(interestSnapshot) {
        if (interestSnapshot.val().name === interest) {
          interestId = interestSnapshot.key();
          return true; // Terminate loop
        }
      });

      defer.resolve(interestId);
    });

    return defer.promise;
  };

  this.addUserTo = function(interest) {
    var defer = $q.defer();

    self.getIdByName(interest).then(function(interestId) {
      // Interest doesn't exist yet
      if (interestId === null) {
        var users = {};

        users[Auth.username()] = true;

        var newInterestRef = interestsRef.push({
          name: interest,
          users: users
        }, function() {
          var newInterestId = newInterestRef.key();

          defer.resolve(newInterestId);
        });
      } else { // Interest already exists
        interestsRef.child(interestId).child('users').child(Auth.username()).set(true, function() {
          defer.resolve(interestId);
        });
      }
    });

    return defer.promise;
  };

  this.removeUserFrom = function(interestId) {
    var defer = $q.defer();
    var usersRef = interestsRef.child(interestId).child('users');

    interestsRef.child(interestId).child('users').child(Auth.username()).remove(function() {
      self.getById(interestId).then(function(interest) {
        if (angular.isDefined(interest.users)) {
          defer.resolve();
        } else {
          interestsRef.child(interestId).remove(function() {
            defer.resolve();
          });
        }
      });      
    });

    return defer.promise;
  };
});
