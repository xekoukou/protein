/*  The initial part of this file belongs to the protein project.

    Copyright (c) 2007-2014 Contributors as noted in the AUTHORS file

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/


//Small changes to Basic classes to make life easier.
Array.prototype.last = function() {
    return this[this.length - 1];
}

function Ribosome() {

    var _fs = require('fs');

    function _Block(s) {
        var self = this;
        this.text = [];
        this.width = 0;

        if (s != null) {
            this.text = s.split('\n');
            this.text.forEach(function(line) {
                self.width = Math.max(self.width, line.length);
            });
        }

        this.add_right = function(block) {
            var i = 0;
            var self = this;
            block.text.forEach(function(line) {
                if (self.text.length > i) {
                    self.text[i] = self.text[i] +
                        Array(self.width - self.text[i].length + 1).join(' ') + line;
                } else {
                    self.text[i] = Array(self.width + 1).join(' ') + line;
                }
                i++;
            });
            this.width += block.width;

        };

        this.add_bottom = function(block) {
            this.text = this.text.concat(block.text);
            this.width = Math.max(this.width, block.width);

        };


        this.trim = function() {

            var top = -1;
            var bottom = -1;
            var left = -1;
            var right = -1;

            this.text.forEach(function(line, index) {

                if (line.trim() != '') {
                    if (top == -1) {
                        top = index;
                    }
                    bottom = index;
                    if (left == -1) {
                        left = line.length - (line + 'W').trim().length + 1;
                    } else {
                        left = Math.min(left, line.length - (line + 'W').trim().length + 1);
                    }
                    if (right == -1) {
                        right = ('W' + line).trim().length - 1;
                    } else {
                        right = Math.min(right, ('W' + line).trim().length - 1);
                    }

                }

            });

            if (bottom == -1) {
                this.text = [];
                this.width = 0;
                return;
            }

            this.text = this.text.slice(top, bottom + 1);

            this.text.forEach(function(line) {
                line = line.slice(left, right);
            });

            this.width = right - left;

        };

        this.write = function(out, outisafile, tabsize) {
            var self = this;
            this.text.forEach(function(line) {

                if (tabsize > 0) {
                    var ws = line.length - (line + 'w').trim().length + 1;
                    var line = Array(Math.floor(ws / tabsize) + 1).join('\t') +
                        Array((ws % tabsize) + 1).join(' ') + (line + 'W').trim().slice(0, -1);
                }
                if (self.outisafile == true) {
                    _fs.appendFileSync(out, line);
                    _fs.appendFileSync(out, '\n');
                } else {
                    out.write(line);
                    out.write('\n');
                }
            });

        };

        this.last_offset = function() {
            if (this.text.length == 0) {
                return 0;
            } else {
                var last = this.text[this.text.length - 1];
                return last.size - ('W' + last).trim() - 1;
            }
        };

    }

    var _tabsize = 0;

    var _outisafile = false;
    var _out = process.stdout;

    var _stack = [
        []
    ];


    this.output = _output;

    function _output(filename) {
        _outisafile = true;
        _out = filename;
    };


    function _stdout() {
        _outisafile = false;
        _out = process.stdout;
    };



    this.tabsize = _change_tabsize;

    function _change_tabsize(size) {
        _tabsize = size;
    };

    this._close = _close;

    function _close() {
        _stack.last().forEach(function(b) {
            b.write(_out, _outisafile, _tabsize);
        });
        _stack = [
            []
        ];
    }

    this._add = _add;

    function _add(_line) {

        if (_stack.last().length == 0) {
            _stack.last().push(new _Block(''));
        }

        var _block = _stack.last().last();

        var _i = 0;

        while (true) {
            var _j = _line.substr(_i).search(/[@&][1-9]?\{/);
            if (_j == -1) {
                _j = _line.length;
            }

            if (_i != _j) {
                _block.add_right(new _Block(_line.slice(_i, _j)));
            }
            if (_j == _line.length) {
                break;
            }

            _i = _j;
            _j++;

            var _level = parseInt(_line.charAt(_j), 10);
            if (isNaN(_level)) {
                _level = 0;
            } else {
                _j++;
            }

            var _par = 0;

            while (true) {
                if (_line.charAt(_j) == '{') {
                    _par++;
                } else {
                    if (_line.charAt(_j) == '}') {
                        _par--;
                    }
                }

                if (_par == 0) {
                    break;
                }
                _j++;

                if (_j >= _line.length) {
                    process.stderr.write('SyntaxError: Unmatched {');
                }
            }

            if (_level > 0) {
                if (_line.charAt(_i + 1) == '1') {
                    _block.add_right(new _Block('@' + _line.slice(_i + 2, _j + 1)));
                } else {
                    _line = _line.slice(0, _i + 1) + (parseInt(_line.charAt(_i + 1)) - 1) + _line.slice(_i + 2);
                    _block.add_right(new _Block(_line.slice(_i, _j + 1)));
                }
                _i = _j + 1;
                continue;
            }

            //TODO level can only be zero here.
            var _expr = _line.slice((_level == 0) ? _i + 2 : _i + 3, _j);

            _stack.push([]);
            var _val = eval(_expr);
            var _top = _stack.pop();
            if (_top.length == 0) {
                _val = new _Block(_val.toString());
            } else {
                _val = new _Block('');
                _top.forEach(function(b) {
                    _val.add_bottom(b);
                });
            }

            if (_line.charAt(_i) == '@') {
                _val.trim();
            }
            _block.add_right(_val);
            _i = _j + 1;

        }



    }

    this._dot = _dot;

    function _dot(line) {
        _stack.last().push(new _Block(''));
        _add(line);
    }

    this._align = _align;

    function _align(line) {
        var n;
        if (_stack.last().length == 0) {
            n = 0;
        } else {
            n = _stack.last().last().last_offset();
        }

        _stack.last().push(new _Block(''));

        _add(Array(n + 1).join(' '));
        _add(line);
    }


    this._rethrow = _rethrow;

    //TODO
    function _rethrow(e, rnafile, linemap) {
        process.stderr.write(e.stack);
    }

}

var ribosome = new Ribosome();

function at() {
    return '@';
}

function amp() {
    return '&';
}

function slash() {
    return '/';
}

///////////////////////////////////////////////////////////////////////
/*
The code that belongs to the ribosome project ends at this point of the      
RNA file and so does the associated license. What follows is the code        
generated from the DNA file.                                                 
*/
///////////////////////////////////////////////////////////////////////
