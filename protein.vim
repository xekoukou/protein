
function CommonView ()
    unlet b:current_syntax
    set syntax=off
    syn match dot "^\..*$"
    syn match nondot "^[^\.].*$"
    highlight nondot ctermfg=Black guifg=Black
    highlight dot ctermfg=Blue guifg=Blue
    let b:current_syntax = "protein-common"
endfunction

function JsView ()
    unlet b:current_syntax
    set syntax=off
    set syntax=javascript
    syn match dot "^\..*$"
    highlight dot ctermfg=Grey guifg=Grey
    let b:current_syntax = "protein-js"
endfunction

function OutputView()
    unlet b:current_syntax
    set syntax=off
    if b:current_output != "none"
        execute 'syntax include @CSYN syntax/' . b:current_output . '.vim'
        syntax region cSnip matchgroup=Snip start=/^\./ end=/$/ keepend contains=@CSYN
        highlight Snip ctermfg=Grey guifg=Grey
    else
        syn match dot "^\..*$"
        highlight dot ctermfg=Black guifg=Black
    endif
    syn match nondot "^[^\.].*$"
    highlight nondot ctermfg=Grey guifg=Grey
    let b:current_syntax = "protein-output"
endfunction

function SetCurrentOutput(s)
    let b:current_output = a:s
    call OutputView()
endfunction

map <F2> :call CommonView()<CR>
map <F3> :call JsView()<CR>
map <F4> :call OutputView()<CR>

command -nargs=1 O call SetCurrentOutput(<f-args>)

let b:current_syntax = ""
let b:current_output = "none"
call CommonView()

