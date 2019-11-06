var RoundRect = require('../game/RoundRect');

module.exports = Piece;

function Piece(x, y, w, h, kindIndex) {
  RoundRect.call(this, x, y, w, h, {
    roundFactor: 1.0,
    stroke: 'black',
    textFill: { fillStyle: 'black', font: '24px sans-serif' }
  });
  this.changeKindIndex(kindIndex);
}

Piece.prototype = Object.create(RoundRect.prototype);

Piece.prototype.changeKindIndex = function(kindIndex) {
  this.kindIndex = kindIndex;
  this.fill = Piece.KindColors[kindIndex];
  this.text = Piece.KindNames[kindIndex];
};

Piece.KindNames = ['♤', '♡', '♢', '♧'];
Piece.KindColors = ['hsl(210,100%,50%)', 'red', 'yellow', 'lime'];
