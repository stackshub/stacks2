var Animation = require('./Animation');

module.exports = Animator;

function Animator() {
  this.animations = [];
}

Animator.prototype.isAnimating = function() {
  return this.animations.length > 0;
};

Animator.prototype.animate = function(params) {
  return this.animations.push(new Animation(params));
};

Animator.prototype.update = function(time) {
  var n = this.animations.length;
  for (var i = 0; i < n; i++) {
    this.animations[i].update(time);
  }
  for (i = n - 1; i >= 0; i--) {
    if (this.animations[i].isFinished()) {
      this.animations.splice(i, 1);
    }
  }
  return this.isAnimating();
};

Animator.prototype.finishAll = function() {
  for (;;) {
    var n = this.animations.length;
    if (n === 0) {
      break;
    }
    for (var i = 0; i < n; i++) {
      this.animations[i].finish();
    }
    this.animations.splice(0, n);
  }
};
