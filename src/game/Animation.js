var Easings = require('./Easings');

module.exports = Animation;

function Animation(options) {
  this.target = options.target;
  this.props = {};
  for (var k in options.props) {
    var prop = options.props[k];
    if (typeof prop === 'number') {
      prop = { finishValue: prop };
    } else if (typeof prop === 'string') {
      prop = { diffValue: parseFloat(prop) };
    } else {
      prop = {
        startValue: prop.startValue,
        finishValue: prop.finishValue,
        diffValue: prop.diffValue
      };
    }
    this.props[k] = prop;
  }
  this.duration = options.duration || 1000;
  this.delay = options.delay || 0;
  this.easing = options.easing || Easings.linear;
  this.onStart = options.onStart;
  this.onUpdate = options.onUpdate;
  this.onFinish = options.onFinish;
  this.state = Animation.States.Ready;
}

Animation.States = {
  Ready: 0,
  Running: 1,
  Finished: 2
};

Animation.prototype.isReady = function() {
  return this.state === Animation.States.Ready;
};

Animation.prototype.isRunning = function() {
  return this.state === Animation.States.Running;
};

Animation.prototype.isFinished = function() {
  return this.state === Animation.States.Finished;
};

Animation.prototype.update = function(time) {
  if (this.isFinished()) {
    return false;
  }
  if (!this.startTime) {
    this.startTime = time + this.delay;
  }
  if (time < this.startTime) {
    return true;
  }
  if (this.isReady()) {
    this.start();
  }
  var p = (time - this.startTime) / this.duration;
  if (p < 1) {
    if (this.easing) {
      for (var name in this.props) {
        var prop = this.props[name];
        this.target[name] = prop.startValue + prop.diffValue * this.easing(p);
      }
    }
    if (this.onUpdate) {
      this.onUpdate(p);
    }
    return true;
  }
  this.finish();
  return false;
};

Animation.prototype.start = function() {
  for (var name in this.props) {
    var prop = this.props[name];
    if (prop.startValue === undefined) {
      prop.startValue = this.target[name];
    }
    if (prop.diffValue === undefined) {
      prop.diffValue = prop.finishValue - prop.startValue;
    }
  }
  this.state = Animation.States.Running;
  if (this.onStart) {
    this.onStart();
  }
};

Animation.prototype.finish = function() {
  if (this.isFinished()) {
    return;
  }
  if (this.isReady()) {
    this.start();
  }
  for (var name in this.props) {
    var prop = this.props[name];
    this.target[name] = prop.startValue + prop.diffValue;
  }
  if (this.onUpdate) {
    this.onUpdate(1);
  }
  this.state = Animation.States.Finished;
  if (this.onFinish) {
    this.onFinish();
  }
};
