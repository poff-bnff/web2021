const readline = require('readline')

const spinners = {
    dots: { interval: 80, frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] },
    dots2: { interval: 80, frames: ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"] },
    dots3: { interval: 80, frames: ["⠋", "⠙", "⠚", "⠞", "⠖", "⠦", "⠴", "⠲", "⠳", "⠓"] },
    dots4: { interval: 80, frames: ["⠄", "⠆", "⠇", "⠋", "⠙", "⠸", "⠰", "⠠", "⠰", "⠸", "⠙", "⠋", "⠇", "⠆"] },
    dots5: { interval: 80, frames: ["⠋", "⠙", "⠚", "⠒", "⠂", "⠂", "⠒", "⠲", "⠴", "⠦", "⠖", "⠒", "⠐", "⠐", "⠒", "⠓", "⠋"] },
    dots6: { interval: 80, frames: ["⠁", "⠉", "⠙", "⠚", "⠒", "⠂", "⠂", "⠒", "⠲", "⠴", "⠤", "⠄", "⠄", "⠤", "⠴", "⠲", "⠒", "⠂", "⠂", "⠒", "⠚", "⠙", "⠉", "⠁"] },
    dots7: { interval: 80, frames: ["⠈", "⠉", "⠋", "⠓", "⠒", "⠐", "⠐", "⠒", "⠖", "⠦", "⠤", "⠠", "⠠", "⠤", "⠦", "⠖", "⠒", "⠐", "⠐", "⠒", "⠓", "⠋", "⠉", "⠈"] },
    dots8: { interval: 80, frames: ["⠁", "⠁", "⠉", "⠙", "⠚", "⠒", "⠂", "⠂", "⠒", "⠲", "⠴", "⠤", "⠄", "⠄", "⠤", "⠠", "⠠", "⠤", "⠦", "⠖", "⠒", "⠐", "⠐", "⠒", "⠓", "⠋", "⠉", "⠈", "⠈"] },
    dots9: { interval: 80, frames: ["⢹", "⢺", "⢼", "⣸", "⣇", "⡧", "⡗", "⡏"] },
    dots10: { interval: 80, frames: ["⢄", "⢂", "⢁", "⡁", "⡈", "⡐", "⡠"] },
    dots11: { interval: 100, frames: ["⠁", "⠂", "⠄", "⡀", "⢀", "⠠", "⠐", "⠈"] },
    dots12: { interval: 80, frames: ["⢀⠀", "⡀⠀", "⠄⠀", "⢂⠀", "⡂⠀", "⠅⠀", "⢃⠀", "⡃⠀", "⠍⠀", "⢋⠀", "⡋⠀", "⠍⠁", "⢋⠁", "⡋⠁", "⠍⠉", "⠋⠉", "⠋⠉", "⠉⠙", "⠉⠙", "⠉⠩", "⠈⢙", "⠈⡙", "⢈⠩", "⡀⢙", "⠄⡙", "⢂⠩", "⡂⢘", "⠅⡘", "⢃⠨", "⡃⢐", "⠍⡐", "⢋⠠", "⡋⢀", "⠍⡁", "⢋⠁", "⡋⠁", "⠍⠉", "⠋⠉", "⠋⠉", "⠉⠙", "⠉⠙", "⠉⠩", "⠈⢙", "⠈⡙", "⠈⠩", "⠀⢙", "⠀⡙", "⠀⠩", "⠀⢘", "⠀⡘", "⠀⠨", "⠀⢐", "⠀⡐", "⠀⠠", "⠀⢀", "⠀⡀"] },
    line: { interval: 130, frames: ["-", "\\", "|", "/"] },
    pipe: { interval: 100, frames: ["┤", "┘", "┴", "└", "├", "┌", "┬", "┐"] },
    simpleDots: { interval: 400, frames: [".  ", ".. ", "...", "   "] },
    simpleDotsScrolling: { interval: 200, frames: [".  ", ".. ", "...", " ..", "  .", "   "] },
    star: { interval: 70, frames: ["✶", "✸", "✹", "✺", "✹", "✷"] },
    star2: { interval: 80, frames: ["+", "x", "*"] },
    flip: { interval: 70, frames: ["_", "_", "_", "-", "`", "`", "'", "´", "-", "_", "_", "_"] },
    hamburger: { interval: 100, frames: ["☱", "☲", "☴"] },
    growVertical: { interval: 120, frames: ["▁", "▃", "▄", "▅", "▆", "▇", "▆", "▅", "▄", "▃"] },
    growHorizontal: { interval: 120, frames: ["▏", "▎", "▍", "▌", "▋", "▊", "▉", "▊", "▋", "▌", "▍", "▎"] },
    balloon: { interval: 140, frames: [" ", ".", "o", "O", "@", "*", " "] },
    balloon2: { interval: 120, frames: [".", "o", "O", "°", "O", "o", "."] },
    noise: { interval: 100, frames: ["▓", "▒", "░"] },
    bounce: { interval: 120, frames: ["⠁", "⠂", "⠄", "⠂"] },
    boxBounce: { interval: 120, frames: ["▖", "▘", "▝", "▗"] },
    boxBounce2: { interval: 100, frames: ["▌", "▀", "▐", "▄"] },
    triangle: { interval: 50, frames: ["◢", "◣", "◤", "◥"] },
    arc: { interval: 100, frames: ["◜", "◠", "◝", "◞", "◡", "◟"] },
    circle: { interval: 120, frames: ["◡", "⊙", "◠"] },
    squareCorners: { interval: 180, frames: ["◰", "◳", "◲", "◱"] },
    circleQuarters: { interval: 120, frames: ["◴", "◷", "◶", "◵"] },
    circleHalves: { interval: 50, frames: ["◐", "◓", "◑", "◒"] },
    toggle2: { interval: 80, frames: ["▫", "▪"] },
    toggle3: { interval: 120, frames: ["□", "■"] },
    toggle7: { interval: 80, frames: ["⦾", "⦿"] },
    toggle8: { interval: 100, frames: ["◍", "◌"] },
    toggle9: { interval: 100, frames: ["◉", "◎"] },
    toggle10: { interval: 100, frames: ["㊂", "㊀", "㊁"] },
    arrow: { interval: 100, frames: ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"] },
    arrow3: { interval: 120, frames: ["▹▹▹▹▹", "▸▹▹▹▹", "▹▸▹▹▹", "▹▹▸▹▹", "▹▹▹▸▹", "▹▹▹▹▸"] },
    bouncingBar: { interval: 80, frames: ["[    ]", "[=   ]", "[==  ]", "[=== ]", "[ ===]", "[  ==]", "[   =]", "[    ]", "[   =]", "[  ==]", "[ ===]", "[====]", "[=== ]", "[==  ]", "[=   ]"] },
    bouncingBall: { interval: 80, frames: ["( ●    )", "(  ●   )", "(   ●  )", "(    ● )", "(     ●)", "(    ● )", "(   ●  )", "(  ●   )", "( ●    )", "(●     )"] },
    bouncingBall2: { interval: 80, frames: ["(∙●    )", "(∙∙●   )", "(∙∙∙●  )", "( ∙∙∙● )", "(  ∙∙∙●)", "(   ∙∙●)", "(    ∙●)", "(    ●∙)", "(   ●∙∙)", "(  ●∙∙∙)", "( ●∙∙∙ )", "(●∙∙∙  )", "(●∙∙   )", "(●∙    )"] },
    shark: { interval: 120, frames: ["▐|\\____________▌", "▐_|\\___________▌", "▐__|\\__________▌", "▐___|\\_________▌", "▐____|\\________▌", "▐_____|\\_______▌", "▐______|\\______▌", "▐_______|\\_____▌", "▐________|\\____▌", "▐_________|\\___▌", "▐__________|\\__▌", "▐___________|\\_▌", "▐____________|\\▌", "▐____________/|▌", "▐___________/|_▌", "▐__________/|__▌", "▐_________/|___▌", "▐________/|____▌", "▐_______/|_____▌", "▐______/|______▌", "▐_____/|_______▌", "▐____/|________▌", "▐___/|_________▌", "▐__/|__________▌", "▐_/|___________▌", "▐/|____________▌"] },
    dqpb: { interval: 250, frames: ["d", "q", "p", "b"] },
    point: { interval: 125, frames: ["∙∙∙", "●∙∙", "∙●∙", "∙∙●", "∙∙∙"] },
    layer: { interval: 350, frames: ["-", "=", "≡", "="] }
};


function* spinner(spinner_name) {
    const symbols = spinners[spinner_name].frames
    const interval = spinners[spinner_name].interval
    const t0 = Math.round(new Date().getTime() / interval)
    while (true) {
        yield symbols[(Math.round(new Date().getTime() / interval) - t0) % symbols.length]
    }
}
const spinner_name = 'dqpb'
const generator = spinner(spinner_name)
const dx = spinners[spinner_name].frames[0].length * -1

const spin = () => {
    let interval = null
    return {
        start: () => {
            readline.moveCursor(process.stdout, 1, 0)
            process.stdout.write('\x1B[?25l') // Hide terminal cursor
            process.stdout.write(generator.next().value)
            interval = setInterval(() => {
                readline.moveCursor(process.stdout, dx, 0)
                process.stdout.write(generator.next().value)
            }, spinners[spinner_name].interval)
        },
        stop: () => {
            readline.moveCursor(process.stdout, dx, 0)
            process.stdout.write(''.padStart(dx*-1, ' '))
            readline.moveCursor(process.stdout, dx, 0)
            clearInterval(interval)
            process.stdout.write('\x1B[?25h') // Show terminal cursor
            readline.moveCursor(process.stdout, -1, 0)
        }
    }
}

exports.spin = spin()
