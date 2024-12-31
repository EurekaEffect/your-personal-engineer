import {alert, throwError} from "../Main";

const ROBO_PARTS = {
    // Name & Score
    'Pristine Robot Brainstorm Bulb':           2.5,
    'Pristine Robot Currency Digester':         2.5,
    'Battle-Worn Robot Taunt Processor':        1.0,
    'Battle-Worn Robot KB-808':                 1.0,
    'Battle-Worn Robot Money Furnace':          1.0,
    'Reinforced Robot Emotion Detector':        0.1,
    'Reinforced Robot Humor Suppression Pump':  0.1,
    'Reinforced Robot Bomb Stabilizer':         0.1
}

type Input = {
    robo_part: string,
    amount: number
}

export function getCompletePercentage($fabricator: Element) {
    const inputs = getNeededInput($fabricator)
    const is_specialized_killstreak = isSpecializedKillstreak($fabricator)

    const score = getScore(inputs)
    const max_score = is_specialized_killstreak ? 24.5 : 24.1

    const percentage = (score / max_score) * 100

    return Math.floor(percentage * 100) / 100 // Rounding.
}

function getScore(inputs: Input[]) {
    let score = 0

    for (let input of inputs) {
        const robo_part = input['robo_part']
        const amount = input['amount']
        const current_score = ROBO_PARTS[robo_part]

        const is_killstreak_item = robo_part.includes('Killstreak Item')
        if (is_killstreak_item) continue

        if (!current_score) {
            const error = `Unknown robo part: '${input[robo_part]}'`

            alert(error)
            throwError(error)
        }

        score += (current_score * amount)
    }

    return score
}

export function getKillstreakItemAmount(inputs: Input[]) {
    let amount = 0

    for (let input of inputs) {
        const robo_part = input['robo_part']
        const current_amount = input['amount']

        const is_killstreak_item = robo_part.includes('Killstreak Item')
        if (!is_killstreak_item) continue

        amount += current_amount
    }

    return amount
}

export function isSpecializedKillstreak($fabricator: Element) {
    const ks_tier = $fabricator.getAttribute('data-ks_tier')

    return ks_tier === '2'
}

export function isProfessionalKillstreak($fabricator: Element) {
    const ks_tier = $fabricator.getAttribute('data-ks_tier')

    return ks_tier === '3'
}

export function getNeededInput($fabricator: Element): Input[] {
    const attribute_name = 'data-input_'

    let robo_parts: Input[] = []

    let i = 1
    while (true) {
        const input = $fabricator.getAttribute(`${attribute_name}${i}`)
        if (!input) break

        let split = input.split('x')
        let robo_part = split[0].trim()
        let amount = parseInt(split[1].trim())

        robo_parts.push({
            robo_part: robo_part,
            amount: amount
        })

        i++
    }

    return robo_parts
}