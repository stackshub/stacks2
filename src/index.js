/* global window */
(function() {
  'use strict';
  var Container = require('./game/Container');
  var Stage = require('./stacks2/Stage');
  new Container(window, new Stage());
})();
