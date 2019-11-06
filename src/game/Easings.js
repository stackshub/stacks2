module.exports = {
  linear: function(p) {
    return p;
  },
  quadIn: function(p) {
    return p * p;
  },
  quadOut: function(p) {
    return p * (2 - p);
  },
  quadInOut: function(p) {
    return p < 0.5 ? 2 * p * p : p * (4 - 2 * p) - 1;
  },
  bounceOut: function(p) {
    if (p < 0.3636) {
      return 7.5625 * p * p;
    } else if (p < 0.7273) {
      p -= 0.5455;
      return 7.5625 * p * p + 0.75;
    } else if (p < 0.9091) {
      p -= 0.8182;
      return 7.5625 * p * p + 0.9375;
    } else {
      p -= 0.9545;
      return 7.5625 * p * p + 0.9844;
    }
  }
};
