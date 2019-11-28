var Animator = require('../game/Animator');
var Answers = require('./Answers');
var Easings = require('../game/Easings');
var Piece = require('./Piece');
var Rect = require('../game/Rect');
var RoundRect = require('../game/RoundRect');
var Shape = require('../game/Shape');

module.exports = Stage;

function Stage() {
  this.w = 360;
  this.h = 480;
  this.background = 'black';
}

Stage.prototype.onReady = function() {
  this.init(this.container.getHash());
};

Stage.prototype.onHashChange = function(hash) {
  this.init(hash);
};

Stage.prototype.init = function(hash) {
  this.titleLabel = new Shape(0, 90, 360, 60, {
    text: 'Stacks 2',
    textFill: { fillStyle: 'white', font: '36px sans-serif' }
  });
  this.startButton = new RoundRect(90, 210, 180, 60, {
    stroke: 'white',
    text: 'Start',
    textFill: 'white'
  });
  this.readmeButton = new RoundRect(90, 330, 180, 60, {
    stroke: 'white',
    text: 'Readme',
    textFill: 'white'
  });
  this.field = new Rect(30, 90, 300, 300, { stroke: 'white' });
  this.levelOutput = new Shape(130, 20, 100, 25, {
    textFill: 'white'
  });
  this.limitOutput = new Shape(130, 45, 100, 25, {
    textFill: 'white'
  });
  this.homeButton = new RoundRect(15, 20, 90, 50, {
    stroke: 'white',
    text: 'Home',
    textFill: 'white'
  });
  this.shuffleButton = new RoundRect(255, 20, 90, 50, {
    stroke: 'white',
    text: 'Shuffle',
    textFill: 'white'
  });
  this.retryButton = new RoundRect(15, 410, 100, 50, {
    stroke: 'white',
    text: 'Retry',
    textFill: 'white'
  });
  this.nextButton = new RoundRect(130, 410, 100, 50, {
    stroke: 'white',
    text: 'Next',
    textFill: 'white'
  });
  this.undoButton = new RoundRect(245, 410, 100, 50, {
    stroke: 'white',
    text: 'Undo',
    textFill: 'white'
  });
  this.cursorIndex = -1;
  var levelIndex;
  if (hash.match(/^[0-1]{2}_[0-1]{2}_[0-1]{2}$/)) {
    levelIndex = 0;
  } else if (hash.match(/^[0-2]{2}_[0-2]{2}_[0-2]{2}$/)) {
    levelIndex = 1;
  } else if (hash.match(/^[0-2]{3}_[0-2]{3}_[0-2]{3}_[0-2]{3}$/)) {
    levelIndex = 2;
  } else if (hash.match(/^[0-3]{3}_[0-3]{3}_[0-3]{3}_[0-3]{3}$/)) {
    levelIndex = 3;
  } else {
    this.goHome();
    return;
  }
  this.goPlay(levelIndex, hash);
};

Stage.prototype.goHome = function() {
  this.container.replaceHash('');
  this.scene = Scenes.Home;
};

Stage.prototype.goPlay = function(levelIndex, initialFieldCode) {
  var level = Levels[levelIndex];
  this.finalFieldCode = level.finalFieldCode;
  var answers = Answers[this.finalFieldCode];
  if (!initialFieldCode) {
    var initialFieldCodes = Object.keys(answers);
    initialFieldCode =
      initialFieldCodes[(Math.random() * initialFieldCodes.length) | 0];
    this.container.replaceHash(initialFieldCode);
  }
  this.initialFieldCode = initialFieldCode;
  this.limitCount = answers[this.initialFieldCode] || 99;
  this.levelIndex = levelIndex;
  this.updateLevelOutput();

  this.stackCount = level.stackCount;
  var rowCount = this.stackCount + 2;
  this.cellW = this.field.w / this.stackCount;
  this.cellH = this.field.h / rowCount;

  var floorY = this.field.my - this.cellH;
  this.floors = new Array(this.stackCount);
  for (var i = 0; i < this.stackCount; i++) {
    this.floors[i] = new Rect(
      this.getStackLeft(i),
      floorY,
      this.cellW,
      this.cellH,
      { stroke: 'white', text: StackNames[i], textFill: 'white' }
    );
  }

  this.cursor = new Rect(0, 0, this.cellW * 0.8, this.cellH * 0.8, {
    cy: this.floors[0].cy,
    stroke: 'white'
  });
  if (this.cursorIndex >= 0) {
    if (this.cursorIndex >= this.stackCount) {
      this.cursorIndex = this.stackCount - 1;
    }
    this.updateCursor();
  }

  this.hints = new Array(level.kindCount);
  if (level.kindCount === this.stackCount) {
    for (i = 0; i < level.kindCount; i++) {
      this.hints[i] = new Rect(
        this.getStackLeft(i),
        this.field.y + this.cellH * 2,
        this.cellW,
        this.cellH * (this.stackCount - 1),
        { fill: Piece.KindColors[i] }
      );
    }
  } else {
    for (i = 0; i < level.kindCount; i++) {
      this.hints[i] = new Rect(
        this.field.x,
        floorY - this.cellH * (i + 1),
        this.cellW * this.stackCount,
        this.cellH,
        { fill: Piece.KindColors[i] }
      );
    }
  }

  var self = this;
  this.stacks = this.initialFieldCode.split('_').map(function(sc, i) {
    return sc.split('').map(function(pc, j) {
      return new Piece(
        self.field.x + self.cellW * i,
        floorY - self.cellH * (j + 1),
        self.cellW,
        self.cellH,
        parseInt(pc)
      );
    });
  });

  this.popIndex = -1;
  this.motions = [];
  this.updateLimitOutput();
  this.animator = new Animator();
  this.completed = false;
  this.hideMessage();
  this.scene = Scenes.Play;
};

Stage.prototype.updateLevelOutput = function() {
  this.levelOutput.text =
    'Level: ' + (this.levelIndex + 1) + ' / ' + Levels.length;
};

Stage.prototype.updateLimitOutput = function() {
  this.limitOutput.text =
    'Limit: ' + this.motions.length + ' <= ' + this.limitCount;
};

Stage.prototype.onPointerDown = function(x, y) {
  if (this.scene === Scenes.Home) {
    if (this.startButton.contains(x, y)) {
      this.goPlay(0);
    } else if (this.readmeButton.contains(x, y)) {
      this.container.openUrl(
        'https://github.com/stackshub/stacks2/blob/master/README.md'
      );
    }
    return;
  }
  var stackIndex = this.getStackIndexAt(x, y);
  if (stackIndex < 0) {
    if (this.homeButton.contains(x, y)) {
      this.goHome();
    } else if (this.shuffleButton.contains(x, y)) {
      this.goPlay(this.levelIndex);
    } else if (this.retryButton.contains(x, y)) {
      this.retry();
    } else if (this.undoButton.contains(x, y)) {
      this.undo();
    } else if (this.nextButton.contains(x, y)) {
      this.next();
    }
    return;
  }
  if (this.popIndex < 0) {
    this.pop(stackIndex);
  } else if (stackIndex === this.popIndex) {
    this.cancel();
  } else {
    this.push(stackIndex);
  }
};

Stage.prototype.getStackIndexAt = function(x, y) {
  if (y < this.field.y || y >= this.field.my) {
    return -1;
  }
  var stackIndex = Math.floor((x - this.field.x) / this.cellW);
  return stackIndex >= 0 && stackIndex < this.stackCount ? stackIndex : -1;
};

Stage.prototype.onKeyDown = function(key) {
  if (this.scene === Scenes.Home) {
    this.cursorIndex = 0;
    this.goPlay(0);
    return;
  }
  switch (key) {
  case 'ArrowLeft':
  case 'Left':
  case 'a':
    if (this.cursorIndex > 0) {
      this.cursorIndex--;
    } else {
      this.cursorIndex = this.stackCount - 1;
    }
    this.updateCursor();
    break;
  case 'ArrowRight':
  case 'Right':
  case 'd':
    this.cursorIndex = (this.cursorIndex + 1) % this.stackCount;
    this.updateCursor();
    break;
  case 'ArrowUp':
  case 'Up':
  case 'w':
    this.popPush();
    break;
  case 'ArrowDown':
  case 'Down':
  case 's':
    this.undo();
    break;
  case 'Escape':
  case 'Esc':
    this.retry();
    break;
  case 'Enter':
  case ' ':
  case 'Spacebar':
    this.next();
    break;
  default:
    return;
  }
};

Stage.prototype.updateCursor = function() {
  this.cursor.cx = this.floors[this.cursorIndex].cx;
};

Stage.prototype.popPush = function() {
  if (this.cursorIndex < 0) {
    return;
  }
  if (this.popIndex < 0) {
    this.pop(this.cursorIndex);
  } else if (this.cursorIndex === this.popIndex) {
    this.cancel();
  } else {
    this.push(this.cursorIndex);
  }
};

Stage.prototype.pop = function(stackIndex) {
  this.animator.finishAll();
  var stack = this.stacks[stackIndex];
  if (stack.length === 0) {
    return;
  }
  var piece = stack[stack.length - 1];
  var checked = false;
  if (
    this.motions.length < this.limitCount &&
    stack.length === this.stackCount
  ) {
    for (var i = 0; i < this.stackCount; i++) {
      if (i === stackIndex) {
        continue;
      }
      var checkStack = this.stacks[i];
      if (checkStack.length === this.stackCount - 2) {
        checkStack.push(stack.pop());
        if (this.toFieldCode(this.stacks) === this.finalFieldCode) {
          checked = true;
        }
        stack.push(checkStack.pop());
        break;
      }
    }
  }
  this.animator.animate({
    target: piece,
    props: {
      y: checked ? -this.cellH * 0.8 : this.field.y
    },
    duration: 200,
    easing: Easings.quadOut
  });
  this.popIndex = stackIndex;
};

Stage.prototype.cancel = function() {
  this.animator.finishAll();
  var stack = this.stacks[this.popIndex];
  var piece = stack[stack.length - 1];
  piece.y = this.getStackTop(this.popIndex);
  this.popIndex = -1;
};

Stage.prototype.push = function(stackIndex) {
  this.animator.finishAll();
  var stack = this.stacks[stackIndex];
  if (stack.length >= this.stackCount) {
    return;
  }
  var piece = this.stacks[this.popIndex].pop();
  stack.push(piece);
  piece.x = this.getStackLeft(stackIndex);
  this.animator.animate({
    target: piece,
    props: { y: this.getStackTop(stackIndex) },
    duration: 200,
    easing: piece.y < this.field.y ? Easings.bounceOut : Easings.quadOut
  });
  this.motions.push([this.popIndex, stackIndex]);
  this.updateLimitOutput();
  this.popIndex = -1;
  if (this.motions.length === this.limitCount) {
    if (this.toFieldCode(this.stacks) === this.finalFieldCode) {
      if (this.levelIndex < Levels.length - 1) {
        this.showMessage('Level Completed', 'aqua');
      } else {
        this.showMessage('Congratulations!', 'yellow');
      }
      this.completed = true;
    } else {
      this.showMessage('Level Failed', 'fuchsia');
    }
  }
};

Stage.prototype.toFieldCode = function(stacks) {
  return stacks
    .map(function(s) {
      return s
        .map(function(p) {
          return p.kindIndex;
        })
        .join('');
    })
    .join('_');
};

Stage.prototype.showMessage = function(text, fill) {
  this.hideMessage();
  this.messageLabel = new RoundRect(
    this.field.x + 20,
    this.field.y + this.cellH / 2,
    this.field.w - 40,
    this.cellH,
    {
      roundFactor: 1.0,
      fill: fill,
      stroke: 'black',
      text: text,
      textFill: { fillStyle: 'black', font: '20px sans-serif' }
    }
  );
  this.messageId = this.container.setTimeout(this.hideMessage.bind(this), 2000);
};

Stage.prototype.hideMessage = function() {
  if (this.messageId) {
    this.container.clearTimeout(this.messageId);
  }
  this.messageId = 0;
  this.messageLabel = null;
};

Stage.prototype.undo = function() {
  this.animator.finishAll();
  if (this.popIndex >= 0) {
    this.cancel();
    return;
  }
  if (this.motions.length === 0) {
    return;
  }
  var motion = this.motions.pop();
  this.updateLimitOutput();
  var piece = this.stacks[motion[1]].pop();
  var srcIndex = motion[0];
  this.stacks[srcIndex].push(piece);
  piece.x = this.getStackLeft(srcIndex);
  piece.y = this.getStackTop(srcIndex);
};

Stage.prototype.retry = function() {
  this.goPlay(this.levelIndex, this.initialFieldCode);
};

Stage.prototype.next = function() {
  if (!this.completed) {
    return;
  }
  this.goPlay((this.levelIndex + 1) % Levels.length);
};

Stage.prototype.getStackLeft = function(stackIndex) {
  return this.field.x + this.cellW * stackIndex;
};

Stage.prototype.getStackTop = function(stackIndex) {
  return this.field.my - this.cellH * (this.stacks[stackIndex].length + 1);
};

Stage.prototype.update = function(time) {
  return this.animator && this.animator.update(time);
};

Stage.prototype.render = function(context) {
  if (this.scene === Scenes.Home) {
    this.titleLabel.render(context);
    this.startButton.render(context);
    this.readmeButton.render(context);
    return;
  }
  for (var i = 0; i < this.hints.length; i++) {
    this.hints[i].render(context);
  }
  for (i = 0; i < this.stackCount; i++) {
    var stack = this.stacks[i];
    for (var j = 0; j < stack.length; j++) {
      stack[j].render(context);
    }
  }
  for (i = 0; i < this.stackCount; i++) {
    this.floors[i].render(context);
  }
  if (this.cursorIndex >= 0) {
    this.cursor.render(context);
  }
  context.strokeStyle = 'white';
  context.beginPath();
  var borderTop = this.field.y + this.cellH;
  var borderBottom = this.field.my - this.cellH;
  for (i = 1; i < this.stackCount; i++) {
    var borderX = this.getStackLeft(i);
    context.moveTo(borderX, borderTop);
    context.lineTo(borderX, borderBottom);
  }
  context.stroke();
  this.field.render(context);
  this.levelOutput.render(context);
  this.limitOutput.render(context);
  this.homeButton.render(context);
  this.shuffleButton.render(context);
  this.retryButton.render(context);
  if (this.completed) {
    this.nextButton.render(context);
  }
  this.undoButton.render(context);
  if (this.messageLabel) {
    this.messageLabel.render(context);
  }
};

var Scenes = {
  Home: 0,
  Play: 1
};

var Levels = [
  {
    stackCount: 3,
    kindCount: 2,
    finalFieldCode: '01_01_01'
  },
  {
    stackCount: 3,
    kindCount: 3,
    finalFieldCode: '00_11_22'
  },
  {
    stackCount: 4,
    kindCount: 3,
    finalFieldCode: '012_012_012_012'
  },
  {
    stackCount: 4,
    kindCount: 4,
    finalFieldCode: '000_111_222_333'
  }
];

var StackNames = ['A', 'B', 'C', 'D'];
