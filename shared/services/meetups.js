angular.module('shared').service('Meetups', function($q, FIREBASE_ROOT, Auth) {
  var meetupsRef = new Firebase(FIREBASE_ROOT + '/meetups');
  var self = this;

  self.all = function() {
    var defer = $q.defer();

    meetupsRef.once('value', function (snapshot) {
      var meetups = snapshot.val();

      if (meetups === null) {
        defer.resolve([]);
      } else {
        var result = [];

        snapshot.forEach(function (meetupSnapshot) {
          var meetup = meetupSnapshot.val();

          if (meetup !== null) {
            meetup.id = meetupSnapshot.key();
          }

          result.push(meetup);
        });

        defer.resolve(result);
      }
    });
    return defer.promise;
  };

  self.add = function(toUsername) {
    var defer = $q.defer();

    var newMeetupsRef = meetupsRef.push({
      to: toUsername,
      from: Auth.username()
    }, function() {
      var newId = newMeetupsRef.key();
      defer.resolve(newId);
    });

    return defer.promise;
  };

  self.getById = function(meetupId) {
    var defer = $q.defer();

    meetupsRef.child(meetupId).once('value', function(snapshot) {
      var meetup = snapshot.val();

      if (meetup !== null) {
        meetup.id = snapshot.key();
      }

      defer.resolve(meetup);
    });

    return defer.promise;
  };
});