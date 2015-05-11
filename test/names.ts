/// <reference path="../type_declarations/index.d.ts" />
import assert = require('assert');

import types = require('../types');
import names = require('../names');

function testParse(input: string, expected: types.Name[], message?: string) {
  it(`should parse "${input}" into expected names`, () => {
    var actual = names.parseNames(input);
    assert.deepEqual(actual, expected, message);
  });
}

describe('Test names.splitNames:', () => {
  describe('Unswapped names:', () => {
    testParse('David Mimno, Hanna M Wallach, and Andrew McCallum', [
      {first: 'David', last: 'Mimno'},
      {first: 'Hanna', middle: 'M', last: 'Wallach'},
      {first: 'Andrew', last: 'McCallum'},
    ]);
    testParse('Aravind K. Joshi, Ben King and Steven Abney', [
      {first: 'Aravind', middle: 'K.', last: 'Joshi'},
      {first: 'Ben', last: 'King'},
      {first: 'Steven', last: 'Abney'},
    ]);
    testParse('Daniel Ramage and Chris Callison-Burch', [
      {first: 'Daniel', last: 'Ramage'},
      {first: 'Chris', last: 'Callison-Burch'},
    ]);
    testParse('David Sankofl', [
      {first: 'David', last: 'Sankofl'},
    ]);
    testParse('Zhao et al.', [
      {last: 'Zhao'},
      {last: 'al.'},
    ]);
    testParse('Yusuke Miyao, Rune Sætre, Kenji Sagae, Takuya Matsuzaki, and Jun’ichi Tsujii', [
      {first: 'Yusuke', last: 'Miyao'},
      {first: 'Rune', last: 'Sætre'},
      {first: 'Kenji', last: 'Sagae'},
      {first: 'Takuya', last: 'Matsuzaki'},
      {first: 'Jun’ichi', last: 'Tsujii'},
    ]);
    testParse('Weiwei Sun and Jia Xu', [
      {first: 'Weiwei', last: 'Sun'},
      {first: 'Jia', last: 'Xu'},
    ]);
  });

  describe('Swapped names:', () => {
    // TODO: autodetect last-name-first swaps, e.g.,
    testParse('Levy, R., & Daumé III, H.', [
      {first: 'R.', last: 'Levy'},
      {first: 'H.', last: 'Daumé III'},
    ]);
    testParse('Chen, S., Beeferman, Rosenfeld, R.', [
      {first: 'S.', last: 'Chen'},
      {             last: 'Beeferman'},
      {first: 'R.', last: 'Rosenfeld'},
    ]);
    testParse('Liu, F., Tian, F., & Zhu, Q.', [
      {first: 'F.', last: 'Liu'},
      {first: 'F.', last: 'Tian'},
      {first: 'Q.', last: 'Zhu'},
    ]);
    testParse('Valtchev, V. Kershaw, D. and Odell, J.', [
      {first: 'V.', last: 'Valtchev'},
      {first: 'D.', last: 'Kershaw'},
      {first: 'J.', last: 'Odell'},
    ]);
    // 'Liu, Tian'; is this ['Tian Liu'] or ['Liu', 'Tian']?
    // testParse('Liu, Tian', [
    //   {first: 'Tian', last: 'Liu'},
    // ]);
  });
});
